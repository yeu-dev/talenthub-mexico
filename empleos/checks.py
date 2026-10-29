from django.conf import settings
from django.core.checks import Warning, register


@register()
def almacenamiento_de_archivos(app_configs, **kwargs):
    """Avisa en el build de Render si los archivos van a caer al disco local.

    Sin las dos variables de Supabase el backend no falla: guarda en MEDIA_ROOT,
    que Render borra en cada despliegue y que con DEBUG apagado ni siquiera se
    sirve. Los CVs se pierden y sus enlaces dan 404 sin que nada lo diga.
    migrate corre los checks, asi que esto sale en el log de cada despliegue.
    """
    if settings.DEBUG or settings.USE_SQLITE:
        return []

    faltan = [nombre for nombre in ('SUPABASE_URL', 'SUPABASE_SERVICE_KEY') if not getattr(settings, nombre)]
    if not faltan:
        return []

    return [
        Warning(
            f"Faltan {', '.join(faltan)}: los CVs y fotos se guardan en el disco del servidor, "
            'que se borra en cada despliegue, y sus enlaces dan 404.',
            hint='Agrégalas en Render → Environment (ver la PR de Supabase Storage).',
            id='empleos.W001',
        )
    ]
