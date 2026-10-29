import mimetypes
import os
import time
import uuid
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from django.utils.text import get_valid_filename


@deconstructible
class SupabaseStorage(Storage):
    """CVs y fotos en un bucket privado de Supabase Storage.

    El disco de Render se borra en cada despliegue y Django solo sirve /media/
    con DEBUG, asi que en produccion los archivos se perdian o no abrian. Aqui
    se suben con la llave secreta del proyecto (nunca sale del servidor) y se
    entregan como URLs firmadas que caducan: un CV no debe quedar publico.
    """

    def __init__(self, url=None, key=None, bucket=None, ttl=None):
        self.base_url = (url or settings.SUPABASE_URL).rstrip('/')
        self.key = key or settings.SUPABASE_SERVICE_KEY
        self.bucket = bucket or settings.SUPABASE_BUCKET
        self.ttl = ttl or settings.SUPABASE_SIGNED_URL_TTL
        self._firmadas = {}

    # -- HTTP ---------------------------------------------------------------

    def _headers(self, extra=None):
        # Las llaves nuevas (sb_secret_...) no son JWT: van solo en apikey y el
        # gateway arma el token. Las legacy (service_role) son JWT y Storage
        # tambien las quiere en Authorization.
        headers = {'apikey': self.key}
        if not self.key.startswith('sb_'):
            headers['Authorization'] = f'Bearer {self.key}'
        headers.update(extra or {})
        return headers

    def _object_url(self, *parts):
        return '/'.join([f'{self.base_url}/storage/v1/object', *parts])

    def _path(self, name):
        return quote(name.replace('\\', '/'), safe='/')

    # -- Storage API ----------------------------------------------------------

    def get_available_name(self, name, max_length=None):
        # Nombres unicos en vez de preguntar si existen: un viaje menos al
        # bucket por archivo, y un CV nuevo nunca pisa la URL firmada del viejo.
        carpeta, archivo = os.path.split(name)
        base, extension = os.path.splitext(get_valid_filename(archivo))
        unico = f'{uuid.uuid4().hex[:12]}_{base[:40]}{extension.lower()}'
        return os.path.join(carpeta, unico).replace('\\', '/')

    def exists(self, name):
        return False

    def _save(self, name, content):
        content.seek(0)
        tipo = getattr(content, 'content_type', None) or mimetypes.guess_type(name)[0] or 'application/octet-stream'
        respuesta = requests.post(
            self._object_url(self.bucket, self._path(name)),
            headers=self._headers({'Content-Type': tipo, 'x-upsert': 'true'}),
            data=content.read(),
            timeout=30,
        )
        respuesta.raise_for_status()
        return name

    def _open(self, name, mode='rb'):
        respuesta = requests.get(
            self._object_url('authenticated', self.bucket, self._path(name)),
            headers=self._headers(),
            timeout=30,
        )
        respuesta.raise_for_status()
        return ContentFile(respuesta.content, name=name)

    def delete(self, name):
        if not name:
            return
        requests.delete(
            self._object_url(self.bucket),
            headers=self._headers({'Content-Type': 'application/json'}),
            json={'prefixes': [name]},
            timeout=30,
        )

    def url(self, name):
        """URL firmada, o '' si el objeto no existe o Storage no responde.

        Se reutiliza mientras le quede al menos la mitad de vida: un listado de
        postulantes pide la misma URL una vez por fila.
        """
        if not name:
            return ''

        ahora = time.time()
        guardada = self._firmadas.get(name)
        if guardada and guardada[1] - ahora > self.ttl / 2:
            return guardada[0]

        try:
            respuesta = requests.post(
                self._object_url('sign', self.bucket, self._path(name)),
                headers=self._headers({'Content-Type': 'application/json'}),
                json={'expiresIn': self.ttl},
                timeout=15,
            )
            respuesta.raise_for_status()
            firmada = respuesta.json().get('signedURL') or respuesta.json().get('signedUrl')
        except (requests.RequestException, ValueError):
            return ''

        if not firmada:
            return ''

        absoluta = firmada if firmada.startswith('http') else f'{self.base_url}/storage/v1{firmada}'
        self._firmadas[name] = (absoluta, ahora + self.ttl)
        return absoluta
