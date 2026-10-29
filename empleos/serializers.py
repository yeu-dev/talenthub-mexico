from rest_framework import serializers
from .models import Usuario, Empresa, Vacante, Aplicacion
from .models import Plan, Suscripcion, Notificacion
from .models import Aspirante
import os


def completitud_perfil(usuario, perfil):
    """Que tan listo esta un aspirante para postularse, de 0 a 100.

    Vive aqui para que la app y la web lean el mismo numero: el CV y lo que
    describe a la persona pesan mas que los datos de contacto.
    """
    puntos = [
        (usuario.username, 10),
        (usuario.email, 10),
        (usuario.telefono, 10),
        (perfil and perfil.profesion, 15),
        (perfil and perfil.experiencia_resumen, 15),
        (perfil and perfil.habilidades, 15),
        (perfil and perfil.cv, 15),
        (perfil and perfil.foto, 10),
    ]
    return sum(peso for valor, peso in puntos if valor)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'tipo', 'telefono']
        extra_kwargs = {'password': {'write_only': True}}

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'
        # Sin esto, un PATCH podia pasarle la empresa a otro usuario.
        read_only_fields = ['usuario', 'fecha_registro']

class VacanteSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre_empresa', read_only=True)
    
    class Meta:
        model = Vacante
        fields = '__all__'
        # La empresa sale de la sesion y la validacion solo la cambia el
        # validador (validar_vacante); si vinieran del cliente, cualquiera
        # publicaria a nombre de otra empresa o se autoaprobaria.
        read_only_fields = ['empresa', 'estado_validacion', 'fecha_publicacion', 'fecha_actualizacion']

class AplicacionSerializer(serializers.ModelSerializer):
    vacante_titulo = serializers.CharField(source='vacante.titulo', read_only=True)
    empresa_nombre = serializers.CharField(source='vacante.empresa.nombre_empresa', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    # Lo que la empresa necesita para decidir sin ver todavia el contacto.
    usuario_profesion = serializers.SerializerMethodField()
    usuario_habilidades = serializers.SerializerMethodField()
    usuario_completitud = serializers.SerializerMethodField()
    
    # Campo dinámico blindado
    cv_url = serializers.SerializerMethodField()

    class Meta:
        model = Aplicacion
        fields = '__all__'
        # El usuario sale de la sesion y el estado lo mueve la empresa con
        # AplicacionEstadoSerializer: un aspirante podia postularse ya
        # 'aceptado'.
        read_only_fields = ['usuario', 'estado', 'fecha_creacion', 'fecha_aplicacion']

    def _perfil(self, obj):
        # Tres campos leen el mismo perfil; en un listado el serializer hijo
        # es uno solo, asi que esto tambien evita repetir la consulta por fila.
        from .models import Aspirante
        cache = self.__dict__.setdefault('_perfiles', {})
        if obj.usuario_id not in cache:
            cache[obj.usuario_id] = Aspirante.objects.filter(usuario_id=obj.usuario_id).first()
        return cache[obj.usuario_id]

    def get_usuario_completitud(self, obj):
        return completitud_perfil(obj.usuario, self._perfil(obj))

    def get_usuario_profesion(self, obj):
        perfil = self._perfil(obj)
        return perfil.profesion if perfil and perfil.profesion else ''

    def get_usuario_habilidades(self, obj):
        perfil = self._perfil(obj)
        if perfil and isinstance(perfil.habilidades, list):
            return perfil.habilidades
        return []

    def get_cv_url(self, obj):
        from .models import Aspirante
        try:
            # 1. Búsqueda ultra-segura por ID
            perfil = Aspirante.objects.filter(usuario_id=obj.usuario_id).first()
            
            # 2. Si el perfil actual tiene un CV válido y fresco, lo usamos
            if perfil and perfil.cv:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(perfil.cv.url)
                return perfil.cv.url
                
            # 3. Fallback: Si no hay CV dinámico, usamos el estático que se guardó al postularse
            # (El getattr evita errores si el campo crudo no viene en la instancia)
            cv_estatico = getattr(obj, 'cv_url', None)
            if cv_estatico:
                return cv_estatico
                
        except Exception:
            pass
            
        # Si de plano no hay CV por ningún lado, manda null para detonar la alerta roja
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # S-SDLC: Data Masking
        if instance.estado in ['revisado', 'aceptado']:
            # Usamos getattr para evitar crashes en producción si faltan datos
            data['usuario_email'] = getattr(instance.usuario, 'email', None)
            data['usuario_telefono'] = getattr(instance.usuario, 'telefono', None)
        else:
            data['usuario_email'] = None
            data['usuario_telefono'] = None
        return data

class AplicacionEstadoSerializer(serializers.ModelSerializer):
    """Lo unico que la empresa puede cambiar de una postulacion."""

    class Meta:
        model = Aplicacion
        fields = ['estado']


class AspiranteSerializer(serializers.ModelSerializer):
    # Inyección de URLs absolutas para evitar errores de carga en Frontend
    foto_url = serializers.SerializerMethodField()
    cv_url = serializers.SerializerMethodField()
    completitud = serializers.SerializerMethodField()

    class Meta:
        model = Aspirante
        fields = '__all__'
        read_only_fields = ['usuario']

    def get_completitud(self, obj):
        return completitud_perfil(obj.usuario, obj)

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return None

    def get_cv_url(self, obj):
        if obj.cv:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv.url)
            return obj.cv.url
        return None

    def validate_cv(self, value):
        if value and hasattr(value, 'name'):
            ext = os.path.splitext(value.name)[1].lower()
            if ext != '.pdf':
                raise serializers.ValidationError("Riesgo de seguridad: El CV debe ser estrictamente un documento PDF.")
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("El archivo PDF excede el límite permitido de 5MB.")
        return value

    def validate_foto(self, value):
        if value and hasattr(value, 'name'):
            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png']
            if ext not in valid_extensions:
                raise serializers.ValidationError("Formato no admitido. La foto debe ser JPG o PNG.")
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError("La imagen excede el límite permitido de 2MB.")
        return value

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SuscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suscripcion
        fields = '__all__'

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'
        # Las crea el sistema; el usuario solo las marca como leidas.
        read_only_fields = ['usuario', 'mensaje', 'fecha']