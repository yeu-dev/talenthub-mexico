from django.apps import AppConfig


class EmpleosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'empleos'

    def ready(self):
        from . import checks  # noqa: F401  (registra los system checks)
