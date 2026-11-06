"""
Siembra empresas de demostración con sus vacantes.

    python manage.py sembrar_empresas            # 100 empresas (o --cuantas N)
    python manage.py sembrar_empresas --borrar   # quita solo las de demostración

- Siempre genera los mismos datos (semilla fija), así que local y producción
  quedan iguales.
- Se puede correr dos veces: si ya hay empresas de demostración, no duplica.
- Las cuentas no tienen contraseña usable: nadie puede iniciar sesión con
  ellas. Sus correos usan `empresas.example`, un dominio reservado que no le
  llega a nadie.
- Las vacantes nacen aprobadas y activas, con fechas repartidas en los
  últimos 60 días, para que se vean en el catálogo como las de una empresa
  real.
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from empleos.models import Empresa, Tecnologia, Usuario, Vacante

PREFIJO = 'demo_empresa_'
SEMILLA = 2026

NOMBRES = [
    'Nébula', 'Quetzal', 'Órbita', 'Cenote', 'Jaguar', 'Volcán', 'Maguey', 'Colibrí', 'Pirámide', 'Tlaloc',
    'Axolote', 'Copal', 'Mezquite', 'Nopal', 'Sierra', 'Marea', 'Cometa', 'Brújula', 'Faro', 'Ceiba',
]
APELLIDOS = ['Labs', 'Systems', 'Digital', 'Tech', 'Software', 'Cloud', 'Data', 'Studio', 'Works', 'Soluciones']

SECTORES = [
    'Fintech', 'Comercio electrónico', 'Salud digital', 'Logística', 'Educación en línea', 'Gobierno digital',
    'Videojuegos', 'Ciberseguridad', 'Telecomunicaciones', 'Consultoría TI', 'Manufactura 4.0', 'Medios digitales',
]

CIUDADES = [
    'Ciudad de México, CDMX', 'Guadalajara, Jal.', 'Monterrey, N.L.', 'Puebla, Pue.', 'Querétaro, Qro.',
    'Mérida, Yuc.', 'León, Gto.', 'Tijuana, B.C.', 'Aguascalientes, Ags.', 'Toluca, Edo. Méx.',
    'Morelia, Mich.', 'Chihuahua, Chih.',
]

# Puesto y el stack que pide. El stack sale de un catálogo corto y realista.
PUESTOS = [
    ('Desarrollador Frontend', ['React', 'TypeScript', 'JavaScript']),
    ('Desarrollador Frontend', ['Vue', 'JavaScript', 'CSS']),
    ('Desarrollador Backend', ['Python', 'Django', 'PostgreSQL']),
    ('Desarrollador Backend', ['Node.js', 'Express', 'MongoDB']),
    ('Desarrollador Backend', ['Java', 'Spring', 'MySQL']),
    ('Desarrollador Backend', ['Go', 'PostgreSQL', 'Docker']),
    ('Desarrollador .NET', ['C#', '.NET', 'SQL Server']),
    ('Desarrollador Full Stack', ['React', 'Node.js', 'PostgreSQL']),
    ('Desarrollador Full Stack', ['Next.js', 'TypeScript', 'Prisma']),
    ('Ingeniero de Datos', ['Python', 'SQL', 'Airflow']),
    ('Analista de Datos', ['SQL', 'Power BI', 'Python']),
    ('Ingeniero DevOps', ['AWS', 'Docker', 'Kubernetes']),
    ('Ingeniero de Nube', ['Azure', 'Terraform', 'Docker']),
    ('QA Automation', ['Cypress', 'JavaScript', 'Selenium']),
    ('Desarrollador Móvil', ['Flutter', 'Dart', 'Firebase']),
    ('Desarrollador Móvil', ['Kotlin', 'Android', 'Firebase']),
    ('Desarrollador iOS', ['Swift', 'iOS', 'Firebase']),
    ('Especialista en Ciberseguridad', ['Linux', 'Python', 'Redes']),
]

NIVELES = [
    # nombre, sueldo mínimo (rango), ancho del rango, experiencia
    ('Jr', (12000, 18000), (5000, 8000), '1 año.'),
    ('Mid', (25000, 35000), (8000, 12000), '3 años.'),
    ('Sr', (45000, 60000), (12000, 20000), '5 años o más.'),
]

# 40% remoto, 30% híbrido, 30% presencial.
MODALIDADES = ['remoto'] * 4 + ['hibrido'] * 3 + ['presencial'] * 3

DESCRIPCIONES = [
    'Buscamos a alguien que se sume al equipo de producto y construya funciones que usan miles de personas.',
    'Te integrarás a un equipo pequeño con revisiones de código, pruebas automáticas y despliegues diarios.',
    'Trabajarás junto a diseño y producto para llevar ideas de la maqueta a producción.',
    'Formarás parte del equipo que mantiene y escala nuestra plataforma principal.',
]

OTROS = ['', 'Inglés intermedio.', 'Inglés avanzado.', 'Experiencia con metodologías ágiles.', 'Git y revisiones de código.']


def redondear(n):
    return int(round(n / 500.0)) * 500


class Command(BaseCommand):
    help = 'Siembra empresas de demostración con sus vacantes (o las borra con --borrar).'

    def add_arguments(self, parser):
        parser.add_argument('--cuantas', type=int, default=100, help='Cuántas empresas crear (100 por defecto).')
        parser.add_argument('--borrar', action='store_true', help='Borra solo las empresas de demostración.')

    def handle(self, *args, **opciones):
        demo = Usuario.objects.filter(username__startswith=PREFIJO)

        if opciones['borrar']:
            total = demo.count()
            # Borrar al usuario borra en cascada su empresa y sus vacantes.
            demo.delete()
            self.stdout.write(self.style.SUCCESS(f'Se borraron {total} empresas de demostración.'))
            return

        if demo.exists():
            self.stdout.write(
                f'Ya hay {demo.count()} empresas de demostración; no se crea nada. '
                'Para empezar de nuevo: --borrar y luego otra vez sin opciones.'
            )
            return

        cuantas = opciones['cuantas']
        azar = random.Random(SEMILLA)
        combinaciones = [f'{n} {a}' for n in NOMBRES for a in APELLIDOS]
        nombres = azar.sample(combinaciones, min(cuantas, len(combinaciones)))
        ahora = timezone.now()
        vacantes_creadas = 0

        with transaction.atomic():
            for k, nombre in enumerate(nombres, start=1):
                usuario = Usuario.objects.create_user(
                    username=f'{PREFIJO}{k:03d}',
                    email=f'rh{k:03d}@empresas.example',
                    password=None,  # sin contraseña usable
                    tipo='empresa',
                )
                ciudad = azar.choice(CIUDADES)
                sector = azar.choice(SECTORES)
                empresa = Empresa.objects.create(
                    usuario=usuario,
                    nombre_empresa=nombre,
                    sector=sector,
                    descripcion=f'{nombre} es una empresa de {sector.lower()} con sede en {ciudad.split(",")[0]}.',
                    ubicacion=ciudad,
                )

                for _ in range(azar.randint(1, 4)):
                    puesto, stack = azar.choice(PUESTOS)
                    nivel, (min_a, min_b), (ancho_a, ancho_b), experiencia = azar.choice(NIVELES)
                    salario_min = redondear(azar.randint(min_a, min_b))
                    salario_max = salario_min + redondear(azar.randint(ancho_a, ancho_b))
                    modalidad = azar.choice(MODALIDADES)
                    vacante = Vacante.objects.create(
                        empresa=empresa,
                        titulo=f'{puesto} {nivel}',
                        descripcion=azar.choice(DESCRIPCIONES),
                        requisitos={'lenguajes': stack, 'experiencia': experiencia, 'otros': azar.choice(OTROS)},
                        salario_min=Decimal(salario_min),
                        salario_max=Decimal(salario_max),
                        ubicacion=ciudad,
                        modalidad=modalidad,
                        activa=True,
                        estado_validacion='aprobada',
                    )
                    # `fecha_publicacion` es auto_now_add: se ajusta después para
                    # repartir las vacantes en los últimos 60 días.
                    Vacante.objects.filter(pk=vacante.pk).update(
                        fecha_publicacion=ahora - timedelta(days=azar.randint(0, 60), hours=azar.randint(0, 23))
                    )
                    vacantes_creadas += 1

            # El catálogo de tecnologías del validador también conoce este stack.
            for _, stack in PUESTOS:
                for tecnologia in stack:
                    Tecnologia.objects.get_or_create(nombre=tecnologia)

        self.stdout.write(
            self.style.SUCCESS(f'Listo: {len(nombres)} empresas de demostración y {vacantes_creadas} vacantes.')
        )
