import shutil
import tempfile
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Aplicacion, Aspirante, Empresa, Notificacion, Plan, Suscripcion, Usuario, Vacante

MEDIA_TEMPORAL = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class PermisosBase(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def setUp(self):
        self.aspirante = Usuario.objects.create_user('ana', 'ana@x.com', 'Clave123!', tipo='aspirante', telefono='111')
        self.aspirante2 = Usuario.objects.create_user('beto', 'beto@x.com', 'Clave123!', tipo='aspirante')
        self.validador = Usuario.objects.create_user('val', 'val@x.com', 'Clave123!', tipo='validador')

        self.usuario_empresa = Usuario.objects.create_user('nebula', 'rh@nebula.com', 'Clave123!', tipo='empresa')
        self.empresa = Empresa.objects.create(
            usuario=self.usuario_empresa, nombre_empresa='Nebula', sector='TI', descripcion='-', ubicacion='MX'
        )
        self.usuario_otra = Usuario.objects.create_user('orbit', 'rh@orbit.com', 'Clave123!', tipo='empresa')
        self.otra_empresa = Empresa.objects.create(
            usuario=self.usuario_otra, nombre_empresa='Orbit', sector='TI', descripcion='-', ubicacion='MX'
        )

        self.publicada = self.crear_vacante('Publicada', activa=True, estado_validacion='aprobada')
        self.pendiente = self.crear_vacante('Pendiente', activa=True, estado_validacion='pendiente')

        Aspirante.objects.create(
            usuario=self.aspirante,
            profesion='Frontend',
            habilidades=['React'],
            cv=SimpleUploadedFile('cv.pdf', b'%PDF-1.4', content_type='application/pdf'),
        )

    def crear_vacante(self, titulo, empresa=None, **extra):
        datos = {
            'empresa': empresa or self.empresa,
            'titulo': titulo,
            'descripcion': 'Descripcion',
            'requisitos': {'lenguajes': ['Python']},
            'salario_min': Decimal('10000'),
            'salario_max': Decimal('20000'),
            'ubicacion': 'Puebla',
            'modalidad': 'remoto',
        }
        datos.update(extra)
        return Vacante.objects.create(**datos)

    def como(self, usuario):
        self.client.force_authenticate(usuario)

    def payload_vacante(self, **extra):
        datos = {
            'titulo': 'Nueva',
            'descripcion': 'Descripcion',
            'requisitos': {'lenguajes': ['Go']},
            'salario_min': '15000',
            'salario_max': '25000',
            'ubicacion': 'CDMX',
            'modalidad': 'hibrido',
        }
        datos.update(extra)
        return datos


class RegistroTests(PermisosBase):
    def test_no_se_puede_registrar_un_validador(self):
        respuesta = self.client.post('/api/register/', {
            'username': 'intruso', 'email': 'i@x.com', 'password': 'Clave123!', 'tipo': 'validador',
        }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Usuario.objects.filter(username='intruso').exists())

    def test_registro_de_empresa_sigue_funcionando(self):
        respuesta = self.client.post('/api/register/', {
            'username': 'nueva', 'email': 'n@x.com', 'password': 'Clave123!', 'tipo': 'empresa',
            'nombre_empresa': 'Nueva SA',
        }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Empresa.objects.filter(nombre_empresa='Nueva SA').exists())


    def test_usuario_o_correo_repetido_da_un_mensaje_legible(self):
        base = {'password': 'Clave123!', 'tipo': 'aspirante'}
        repetido = self.client.post('/api/register/', {**base, 'username': 'ANA', 'email': 'otra@x.com'}, format='json')
        self.assertEqual(repetido.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('usuario', repetido.data['message'])
        correo = self.client.post('/api/register/', {**base, 'username': 'ana2', 'email': 'ANA@x.com'}, format='json')
        self.assertEqual(correo.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('correo', correo.data['message'])


class EmpresaTests(PermisosBase):
    def test_sin_sesion_no_se_edita_ni_borra_una_empresa(self):
        url = f'/api/empresas/{self.empresa.id}/'
        self.assertEqual(self.client.patch(url, {'nombre_empresa': 'X'}, format='json').status_code, 401)
        self.assertEqual(self.client.delete(url).status_code, 401)
        self.empresa.refresh_from_db()
        self.assertEqual(self.empresa.nombre_empresa, 'Nebula')

    def test_otra_cuenta_no_edita_la_empresa(self):
        self.como(self.usuario_otra)
        respuesta = self.client.patch(f'/api/empresas/{self.empresa.id}/', {'nombre_empresa': 'X'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_la_duena_edita_pero_no_se_la_pasa_a_otro(self):
        self.como(self.usuario_empresa)
        respuesta = self.client.patch(
            f'/api/empresas/{self.empresa.id}/',
            {'descripcion': 'Nueva', 'usuario': self.aspirante.id},
            format='json',
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.empresa.refresh_from_db()
        self.assertEqual(self.empresa.descripcion, 'Nueva')
        self.assertEqual(self.empresa.usuario_id, self.usuario_empresa.id)

    def test_el_directorio_sigue_siendo_publico(self):
        respuesta = self.client.get(f'/api/empresas/?usuario={self.usuario_empresa.id}')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data[0]['id'], self.empresa.id)


class VacanteTests(PermisosBase):
    def test_el_catalogo_publico_solo_muestra_lo_aprobado(self):
        titulos = {v['titulo'] for v in self.client.get('/api/vacantes/').data}
        self.assertEqual(titulos, {'Publicada'})

    def test_filtrar_por_empresa_ajena_no_expone_pendientes(self):
        self.como(self.aspirante)
        titulos = {v['titulo'] for v in self.client.get(f'/api/vacantes/?empresa={self.empresa.id}').data}
        self.assertEqual(titulos, {'Publicada'})

    def test_la_empresa_ve_su_cola_completa(self):
        self.como(self.usuario_empresa)
        titulos = {v['titulo'] for v in self.client.get(f'/api/vacantes/?empresa={self.empresa.id}').data}
        self.assertEqual(titulos, {'Publicada', 'Pendiente'})

    def test_un_aspirante_no_publica(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/vacantes/', self.payload_vacante(), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)

    def test_publicar_entra_pendiente_y_a_nombre_propio(self):
        self.como(self.usuario_empresa)
        respuesta = self.client.post('/api/vacantes/', self.payload_vacante(
            empresa=self.otra_empresa.id, estado_validacion='aprobada', activa=True,
        ), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        vacante = Vacante.objects.get(id=respuesta.data['id'])
        self.assertEqual(vacante.empresa_id, self.empresa.id)
        self.assertEqual(vacante.estado_validacion, 'pendiente')

    def test_activar_una_pendiente_no_la_publica(self):
        self.como(self.usuario_empresa)
        respuesta = self.client.patch(
            f'/api/vacantes/{self.pendiente.id}/?empresa={self.empresa.id}', {'activa': True}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.client.force_authenticate(None)
        titulos = {v['titulo'] for v in self.client.get('/api/vacantes/').data}
        self.assertNotIn('Pendiente', titulos)

    def test_la_empresa_no_se_autoaprueba(self):
        self.como(self.usuario_empresa)
        self.client.patch(f'/api/vacantes/{self.pendiente.id}/', {'estado_validacion': 'aprobada'}, format='json')
        self.pendiente.refresh_from_db()
        self.assertEqual(self.pendiente.estado_validacion, 'pendiente')

    def test_otra_empresa_no_edita_ni_borra(self):
        self.como(self.usuario_otra)
        url = f'/api/vacantes/{self.publicada.id}/'
        self.assertEqual(self.client.patch(url, {'titulo': 'X'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.assertTrue(Vacante.objects.filter(id=self.publicada.id, titulo='Publicada').exists())

    def test_editar_lo_revisado_regresa_a_la_cola(self):
        self.como(self.usuario_empresa)
        respuesta = self.client.patch(f'/api/vacantes/{self.publicada.id}/', {'salario_max': '90000'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.publicada.refresh_from_db()
        self.assertEqual(self.publicada.estado_validacion, 'pendiente')

    def test_cerrar_la_vacante_no_la_regresa_a_la_cola(self):
        self.como(self.usuario_empresa)
        self.client.patch(f'/api/vacantes/{self.publicada.id}/', {'activa': False}, format='json')
        self.publicada.refresh_from_db()
        self.assertFalse(self.publicada.activa)
        self.assertEqual(self.publicada.estado_validacion, 'aprobada')

    def test_la_edicion_completa_de_la_web_sigue_funcionando(self):
        self.como(self.usuario_empresa)
        respuesta = self.client.put(f'/api/vacantes/{self.pendiente.id}/', self.payload_vacante(
            activa=False, empresa=self.empresa.id,
        ), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.pendiente.refresh_from_db()
        self.assertEqual(self.pendiente.titulo, 'Nueva')

    def test_el_validador_sigue_aprobando(self):
        self.como(self.validador)
        respuesta = self.client.post(f'/api/vacantes/validar/{self.pendiente.id}/', {'accion': 'aprobar'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.pendiente.refresh_from_db()
        self.assertEqual(self.pendiente.estado_validacion, 'aprobada')


class AplicacionTests(PermisosBase):
    def postularse(self, vacante, **extra):
        datos = {'vacante': vacante.id}
        datos.update(extra)
        return self.client.post('/api/aplicaciones/', datos, format='json')

    def test_postularse_sin_mandar_usuario_y_sin_poder_elegir_estado(self):
        self.como(self.aspirante)
        respuesta = self.postularse(self.publicada, estado='aceptado', usuario=self.aspirante2.id)
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        aplicacion = Aplicacion.objects.get(id=respuesta.data['id'])
        self.assertEqual(aplicacion.usuario_id, self.aspirante.id)
        self.assertEqual(aplicacion.estado, 'pendiente')
        self.assertEqual(respuesta.data['empresa_nombre'], 'Nebula')

    def test_postularse_dos_veces_da_un_error_legible(self):
        self.como(self.aspirante)
        self.postularse(self.publicada)
        respuesta = self.postularse(self.publicada)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(respuesta.data['error'], 'YA_POSTULADO')

    def test_no_se_postula_a_una_pendiente(self):
        self.como(self.aspirante)
        respuesta = self.postularse(self.pendiente)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(respuesta.data['error'], 'VACANTE_NO_DISPONIBLE')

    def test_sin_cv_no_se_postula(self):
        self.como(self.aspirante2)
        respuesta = self.postularse(self.publicada)
        self.assertEqual(respuesta.data['error'], 'CV_MISSING')

    def test_una_empresa_no_se_postula(self):
        self.como(self.usuario_otra)
        self.assertEqual(self.postularse(self.publicada).status_code, status.HTTP_403_FORBIDDEN)

    def crear_aplicacion(self):
        return Aplicacion.objects.create(vacante=self.publicada, usuario=self.aspirante, estado='pendiente')

    def test_el_aspirante_no_se_acepta_solo(self):
        aplicacion = self.crear_aplicacion()
        self.como(self.aspirante)
        respuesta = self.client.patch(f'/api/aplicaciones/{aplicacion.id}/', {'estado': 'aceptado'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)
        aplicacion.refresh_from_db()
        self.assertEqual(aplicacion.estado, 'pendiente')

    def test_otra_empresa_no_ve_ni_mueve_la_postulacion(self):
        aplicacion = self.crear_aplicacion()
        self.como(self.usuario_otra)
        respuesta = self.client.patch(f'/api/aplicaciones/{aplicacion.id}/', {'estado': 'rechazado'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)

    def test_la_empresa_duena_mueve_el_estado_y_solo_el_estado(self):
        aplicacion = self.crear_aplicacion()
        self.como(self.usuario_empresa)
        respuesta = self.client.patch(
            f'/api/aplicaciones/{aplicacion.id}/',
            {'estado': 'revisado', 'carta_presentacion': 'reescrita', 'vacante': self.pendiente.id},
            format='json',
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        aplicacion.refresh_from_db()
        self.assertEqual(aplicacion.estado, 'revisado')
        self.assertEqual(aplicacion.carta_presentacion, '')
        self.assertEqual(aplicacion.vacante_id, self.publicada.id)
        self.assertTrue(Notificacion.objects.filter(usuario=self.aspirante).exists())
        # El contacto aparece solo cuando el proceso avanza.
        self.assertEqual(respuesta.data['usuario_email'], 'ana@x.com')
        self.assertEqual(respuesta.data['usuario_profesion'], 'Frontend')
        self.assertEqual(respuesta.data['usuario_habilidades'], ['React'])
        # usuario, correo, telefono, profesion, habilidades y CV; faltan resumen y foto.
        self.assertEqual(respuesta.data['usuario_completitud'], 75)

    def test_la_empresa_no_borra_postulaciones(self):
        aplicacion = self.crear_aplicacion()
        self.como(self.usuario_empresa)
        self.assertEqual(self.client.delete(f'/api/aplicaciones/{aplicacion.id}/').status_code, 403)
        self.como(self.aspirante)
        self.assertEqual(self.client.delete(f'/api/aplicaciones/{aplicacion.id}/').status_code, 204)


class LimitesDePlanTests(PermisosBase):
    """Los limites de los planes se aplican de verdad, no solo se muestran."""

    def setUp(self):
        super().setUp()
        # El segundo aspirante tambien necesita CV para poder postularse.
        Aspirante.objects.create(
            usuario=self.aspirante2,
            profesion='Backend',
            habilidades=['Python'],
            cv=SimpleUploadedFile('cv2.pdf', b'%PDF-1.4', content_type='application/pdf'),
        )

    def postularse(self, usuario, vacante=None):
        self.como(usuario)
        return self.client.post('/api/aplicaciones/', {'vacante': (vacante or self.publicada).id}, format='json')

    def suscribir(self, usuario, plan, **extra):
        return Suscripcion.objects.create(usuario=usuario, plan=plan, activa=True, **extra)

    def test_la_vacante_se_llena_al_llegar_al_limite_de_candidatos_del_plan_de_la_empresa(self):
        plan = Plan.objects.create(nombre='Mini', tipo_usuario='empresa', precio=Decimal('99.00'), max_candidatos=1)
        self.suscribir(self.usuario_empresa, plan)

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        respuesta = self.postularse(self.aspirante2)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(respuesta.data['error'], 'VACANTE_LLENA')

    def test_las_rechazadas_siguen_contando_para_el_limite(self):
        plan = Plan.objects.create(nombre='Mini', tipo_usuario='empresa', precio=Decimal('99.00'), max_candidatos=1)
        self.suscribir(self.usuario_empresa, plan)
        Aplicacion.objects.create(vacante=self.publicada, usuario=self.aspirante, estado='rechazado')

        respuesta = self.postularse(self.aspirante2)
        self.assertEqual(respuesta.data['error'], 'VACANTE_LLENA')

    def test_sin_limite_si_el_plan_no_lo_define(self):
        plan = Plan.objects.create(nombre='Abierto', tipo_usuario='empresa', precio=Decimal('0'), max_candidatos=None)
        self.suscribir(self.usuario_empresa, plan)

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.postularse(self.aspirante2).status_code, status.HTTP_201_CREATED)

    def test_sin_suscripcion_aplica_el_plan_gratis_de_empresa(self):
        Plan.objects.create(nombre='GRATIS', tipo_usuario='empresa', precio=Decimal('0'), max_candidatos=1)

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.postularse(self.aspirante2).data['error'], 'VACANTE_LLENA')

    def test_sin_suscripcion_ni_plan_gratis_no_hay_limite(self):
        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.postularse(self.aspirante2).status_code, status.HTTP_201_CREATED)

    def test_una_suscripcion_vencida_cae_al_plan_gratis(self):
        Plan.objects.create(nombre='GRATIS', tipo_usuario='empresa', precio=Decimal('0'), max_candidatos=1)
        pro = Plan.objects.create(nombre='PRO', tipo_usuario='empresa', precio=Decimal('399.00'), max_candidatos=100)
        self.suscribir(self.usuario_empresa, pro, fecha_fin=timezone.now() - timedelta(days=1))

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.postularse(self.aspirante2).data['error'], 'VACANTE_LLENA')

    def test_el_limite_de_una_vacante_no_toca_las_de_otra_empresa(self):
        plan = Plan.objects.create(nombre='Mini', tipo_usuario='empresa', precio=Decimal('99.00'), max_candidatos=1)
        self.suscribir(self.usuario_empresa, plan)
        de_orbit = self.crear_vacante('De Orbit', empresa=self.otra_empresa, activa=True, estado_validacion='aprobada')

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.postularse(self.aspirante2, de_orbit).status_code, status.HTTP_201_CREATED)

    def test_el_limite_diario_del_aspirante_sigue_aplicando(self):
        plan = Plan.objects.create(nombre='GRATIS', tipo_usuario='aspirante', precio=Decimal('0'), max_postulaciones_dia=1)
        self.suscribir(self.aspirante, plan)
        otra = self.crear_vacante('Otra', activa=True, estado_validacion='aprobada')

        self.assertEqual(self.postularse(self.aspirante).status_code, status.HTTP_201_CREATED)
        respuesta = self.postularse(self.aspirante, otra)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('límite de postulaciones diarias', respuesta.data['detail'])

    def test_mi_suscripcion_no_muestra_un_plan_vencido(self):
        pro = Plan.objects.create(nombre='PRO', tipo_usuario='empresa', precio=Decimal('399.00'))
        self.suscribir(self.usuario_empresa, pro, fecha_fin=timezone.now() - timedelta(days=1))
        self.como(self.usuario_empresa)

        self.assertEqual(self.client.get('/api/suscripcion/actual/').data['plan'], 'GRATIS')


class SuscripcionYNotificacionTests(PermisosBase):
    def setUp(self):
        super().setUp()
        self.plan_pro = Plan.objects.create(nombre='Pro', tipo_usuario='aspirante', precio=Decimal('199.00'))
        self.plan_basico = Plan.objects.create(nombre='Basico', tipo_usuario='aspirante', precio=Decimal('49.00'))

    def test_no_se_contrata_un_plan_con_un_post(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/suscripciones/', {'plan': self.plan_pro.id}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(Suscripcion.objects.exists())

    def test_solo_se_ven_las_suscripciones_propias(self):
        Suscripcion.objects.create(usuario=self.aspirante2, plan=self.plan_pro)
        self.como(self.aspirante)
        self.assertEqual(self.client.get('/api/suscripciones/').data, [])

    def test_no_se_crean_notificaciones_para_otros(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/notificaciones/', {
            'usuario': self.aspirante2.id, 'mensaje': 'Ganaste un premio',
        }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_marcar_como_leida_sin_reescribir_el_mensaje(self):
        notificacion = Notificacion.objects.create(usuario=self.aspirante, mensaje='Original')
        self.como(self.aspirante)
        respuesta = self.client.patch(
            f'/api/notificaciones/{notificacion.id}/', {'leido': True, 'mensaje': 'Otro'}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        notificacion.refresh_from_db()
        self.assertTrue(notificacion.leido)
        self.assertEqual(notificacion.mensaje, 'Original')

    def test_marcar_leidas_solo_toca_las_del_usuario(self):
        Notificacion.objects.create(usuario=self.aspirante, mensaje='Uno')
        Notificacion.objects.create(usuario=self.aspirante, mensaje='Dos')
        Notificacion.objects.create(usuario=self.aspirante, mensaje='Ya leida', leido=True)
        ajena = Notificacion.objects.create(usuario=self.aspirante2, mensaje='De Beto')
        self.como(self.aspirante)

        respuesta = self.client.post('/api/notificaciones/marcar-leidas/')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['marcadas'], 2)
        self.assertFalse(Notificacion.objects.filter(usuario=self.aspirante, leido=False).exists())
        ajena.refresh_from_db()
        self.assertFalse(ajena.leido)

    def test_marcar_leidas_pide_sesion(self):
        respuesta = self.client.post('/api/notificaciones/marcar-leidas/')
        self.assertIn(respuesta.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def captura(self, monto):
        respuesta = mock.Mock()
        respuesta.json.return_value = {
            'status': 'COMPLETED',
            'purchase_units': [{'payments': {'captures': [{'amount': {'value': monto, 'currency_code': 'MXN'}}]}}],
        }
        return respuesta

    def test_crear_pago_de_un_plan_que_no_existe(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/pago/crear/', {'plan_id': 9999}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(respuesta.data['error'], 'PLAN_NO_ENCONTRADO')

    @mock.patch('empleos.views.get_access_token', side_effect=RuntimeError('Faltan PAYPAL_CLIENT_ID'))
    def test_crear_pago_sin_paypal_no_filtra_el_error_interno(self, _token):
        self.como(self.aspirante)
        with self.assertLogs('empleos.views', level='ERROR'):
            respuesta = self.client.post('/api/pago/crear/', {'plan_id': self.plan_pro.id}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(respuesta.data['error'], 'PAGOS_NO_DISPONIBLES')
        self.assertNotIn('PAYPAL', str(respuesta.data))

    @mock.patch('empleos.views.get_access_token', return_value='token')
    def test_pagar_el_plan_barato_no_activa_el_caro(self, _token):
        self.como(self.aspirante)
        with mock.patch('empleos.views.requests.post', return_value=self.captura('49.00')):
            respuesta = self.client.post('/api/pago/capturar/', {
                'order_id': 'ORDEN', 'plan_id': self.plan_pro.id,
            }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Suscripcion.objects.filter(usuario=self.aspirante).exists())

    @mock.patch('empleos.views.get_access_token', return_value='token')
    def test_pagar_el_precio_correcto_activa_el_plan(self, _token):
        self.como(self.aspirante)
        with mock.patch('empleos.views.requests.post', return_value=self.captura('199.00')):
            respuesta = self.client.post('/api/pago/capturar/', {
                'order_id': 'ORDEN', 'plan_id': self.plan_pro.id,
            }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertTrue(Suscripcion.objects.filter(usuario=self.aspirante, plan=self.plan_pro, activa=True).exists())


class PerfilAspiranteTests(PermisosBase):
    def test_el_perfil_trae_su_completitud(self):
        self.como(self.aspirante2)
        respuesta = self.client.get('/api/perfil/aspirante/')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        # Solo usuario y correo: beto no tiene telefono ni perfil lleno.
        self.assertEqual(respuesta.data['completitud'], 20)

    def test_cambiar_username_se_aplica(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/perfil/aspirante/', {'username': 'ana_dev'}, format='multipart')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.aspirante.refresh_from_db()
        self.assertEqual(self.aspirante.username, 'ana_dev')

    def test_un_username_tomado_da_error_legible(self):
        self.como(self.aspirante)
        respuesta = self.client.post('/api/perfil/aspirante/', {'username': 'beto'}, format='multipart')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', respuesta.data)

    def perfil_ana(self):
        return Aspirante.objects.get(usuario=self.aspirante)

    def test_quitar_el_cv_lo_borra_del_perfil_y_del_almacenamiento(self):
        perfil = self.perfil_ana()
        nombre = perfil.cv.name
        self.assertTrue(perfil.cv.storage.exists(nombre))
        self.como(self.aspirante)

        respuesta = self.client.post('/api/perfil/aspirante/', {'quitar_cv': 'true'}, format='multipart')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIsNone(respuesta.data['cv_url'])
        perfil.refresh_from_db()
        self.assertFalse(perfil.cv)
        self.assertFalse(perfil.cv.storage.exists(nombre))

    def test_reemplazar_el_cv_borra_el_anterior(self):
        perfil = self.perfil_ana()
        anterior = perfil.cv.name
        self.como(self.aspirante)

        nuevo = SimpleUploadedFile('nuevo.pdf', b'%PDF-1.4 nuevo', content_type='application/pdf')
        respuesta = self.client.post('/api/perfil/aspirante/', {'cv': nuevo}, format='multipart')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        perfil.refresh_from_db()
        self.assertNotEqual(perfil.cv.name, anterior)
        self.assertTrue(perfil.cv.storage.exists(perfil.cv.name))
        self.assertFalse(perfil.cv.storage.exists(anterior))

    def test_si_viene_archivo_nuevo_gana_sobre_quitar(self):
        self.como(self.aspirante)
        nuevo = SimpleUploadedFile('otro.pdf', b'%PDF-1.4 otro', content_type='application/pdf')
        self.client.post('/api/perfil/aspirante/', {'cv': nuevo, 'quitar_cv': 'true'}, format='multipart')
        self.assertTrue(self.perfil_ana().cv)

    def test_quitar_la_foto(self):
        perfil = self.perfil_ana()
        perfil.foto = SimpleUploadedFile('yo.png', b'\x89PNG', content_type='image/png')
        perfil.save()
        self.como(self.aspirante)

        respuesta = self.client.post('/api/perfil/aspirante/', {'quitar_foto': 'true'}, format='multipart')
        self.assertIsNone(respuesta.data['foto_url'])
        self.assertFalse(self.perfil_ana().foto)

    def test_las_habilidades_se_guardan_como_lista(self):
        self.como(self.aspirante)
        self.client.post('/api/perfil/aspirante/', {'habilidades': '["React", " Python ", ""]'}, format='multipart')
        self.assertEqual(self.perfil_ana().habilidades, ['React', 'Python'])

        # Un texto con comas (la web anterior) ya no se guarda como un solo elemento.
        self.client.post('/api/perfil/aspirante/', {'habilidades': 'Docker, AWS'}, format='multipart')
        self.assertEqual(self.perfil_ana().habilidades, ['Docker', 'AWS'])


class SupabaseStorageTests(PermisosBase):
    """Supabase no es alcanzable desde las pruebas: se simula su API HTTP."""

    URL = 'https://ref.supabase.co'

    def storage(self, key='eyJ.legacy.jwt'):
        from .storage import SupabaseStorage
        return SupabaseStorage(url=self.URL, key=key, bucket='talenthub', ttl=3600)

    def respuesta(self, json=None):
        r = mock.Mock()
        r.raise_for_status.return_value = None
        r.json.return_value = json or {}
        return r

    def test_subir_usa_nombre_unico_y_la_llave_correcta(self):
        storage = self.storage()
        with mock.patch('empleos.storage.requests.post', return_value=self.respuesta()) as post:
            nombre = storage.save('cvs/Mi CV.pdf', SimpleUploadedFile('Mi CV.pdf', b'%PDF', content_type='application/pdf'))
        self.assertTrue(nombre.startswith('cvs/') and nombre.endswith('_Mi_CV.pdf'), nombre)
        url, = post.call_args.args
        self.assertEqual(url, f'{self.URL}/storage/v1/object/talenthub/{nombre}')
        headers = post.call_args.kwargs['headers']
        self.assertEqual(headers['Authorization'], 'Bearer eyJ.legacy.jwt')
        self.assertEqual(headers['Content-Type'], 'application/pdf')

    def test_las_llaves_nuevas_van_solo_en_apikey(self):
        headers = self.storage(key='sb_secret_abc')._headers()
        self.assertEqual(headers, {'apikey': 'sb_secret_abc'})

    def test_la_url_firmada_se_reutiliza(self):
        storage = self.storage()
        firmada = self.respuesta({'signedURL': '/object/sign/talenthub/cvs/a.pdf?token=t'})
        with mock.patch('empleos.storage.requests.post', return_value=firmada) as post:
            primera = storage.url('cvs/a.pdf')
            segunda = storage.url('cvs/a.pdf')
        self.assertEqual(primera, f'{self.URL}/storage/v1/object/sign/talenthub/cvs/a.pdf?token=t')
        self.assertEqual(primera, segunda)
        self.assertEqual(post.call_count, 1)

    def test_un_archivo_perdido_no_rompe_el_perfil(self):
        import requests as http
        storage = self.storage()
        caido = mock.Mock()
        caido.raise_for_status.side_effect = http.HTTPError('404')
        with mock.patch('empleos.storage.requests.post', return_value=caido):
            self.assertEqual(storage.url('cvs/perdido.pdf'), '')

    def test_el_perfil_entrega_el_cv_como_url_firmada(self):
        storages = {
            'default': {
                'BACKEND': 'empleos.storage.SupabaseStorage',
                'OPTIONS': {'url': self.URL, 'key': 'eyJ.legacy.jwt', 'bucket': 'talenthub', 'ttl': 3600},
            },
            'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
        }

        def falso_post(url, **kwargs):
            if '/object/sign/' in url:
                ruta = url.split('/object/sign/talenthub/')[1]
                return self.respuesta({'signedURL': f'/object/sign/talenthub/{ruta}?token=t'})
            return self.respuesta()

        self.como(self.aspirante2)
        with override_settings(STORAGES=storages), mock.patch('empleos.storage.requests.post', side_effect=falso_post):
            respuesta = self.client.post('/api/perfil/aspirante/', {
                'cv': SimpleUploadedFile('cv.pdf', b'%PDF-1.4', content_type='application/pdf'),
            }, format='multipart')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK, respuesta.data)
        self.assertTrue(respuesta.data['cv_url'].startswith(f'{self.URL}/storage/v1/object/sign/talenthub/cvs/'))
        self.assertTrue(respuesta.data['cv_url'].endswith('?token=t'))


class RecuperarPasswordTests(PermisosBase):
    @mock.patch('empleos.views.send_mail')
    def test_encuentra_la_cuenta_sin_importar_mayusculas(self, enviar):
        respuesta = self.client.post('/api/recuperar-password/', {'email': '  ANA@X.com '}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(enviar.call_args.args[3], ['ana@x.com'])

    @mock.patch('empleos.views.send_mail')
    def test_correo_repetido_no_truena(self, enviar):
        Usuario.objects.create_user('ana2', 'Ana@x.com', 'Clave123!', tipo='aspirante')
        respuesta = self.client.post('/api/recuperar-password/', {'email': 'ana@x.com'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(enviar.call_count, 1)

    @mock.patch('empleos.views.send_mail')
    def test_correo_desconocido_responde_igual_sin_enviar(self, enviar):
        respuesta = self.client.post('/api/recuperar-password/', {'email': 'nadie@x.com'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        enviar.assert_not_called()


class SembrarEmpresasTests(PermisosBase):
    """El comando que siembra las empresas de demostración."""

    def sembrar(self, *args):
        from io import StringIO
        from django.core.management import call_command

        call_command('sembrar_empresas', *args, stdout=StringIO())

    def test_crea_las_empresas_con_vacantes_publicas(self):
        self.sembrar('--cuantas', '12')
        demo = Empresa.objects.filter(usuario__username__startswith='demo_empresa_')
        self.assertEqual(demo.count(), 12)
        vacantes = Vacante.objects.filter(empresa__in=demo)
        self.assertGreaterEqual(vacantes.count(), 12)
        self.assertFalse(vacantes.exclude(activa=True, estado_validacion='aprobada').exists())
        # Salen en el catálogo público, como las de cualquier empresa.
        respuesta = self.client.get('/api/vacantes/')
        self.assertGreaterEqual(len(respuesta.data), vacantes.count())

    def test_las_cuentas_no_pueden_iniciar_sesion(self):
        self.sembrar('--cuantas', '3')
        for usuario in Usuario.objects.filter(username__startswith='demo_empresa_'):
            self.assertFalse(usuario.has_usable_password())
            self.assertTrue(usuario.email.endswith('@empresas.example'))

    def test_correrlo_dos_veces_no_duplica(self):
        self.sembrar('--cuantas', '5')
        self.sembrar('--cuantas', '5')
        self.assertEqual(Usuario.objects.filter(username__startswith='demo_empresa_').count(), 5)

    def test_borrar_solo_quita_las_de_demostracion(self):
        propias = Empresa.objects.count()
        self.sembrar('--cuantas', '4')
        self.sembrar('--borrar')
        self.assertEqual(Empresa.objects.count(), propias)
        self.assertFalse(Usuario.objects.filter(username__startswith='demo_empresa_').exists())
