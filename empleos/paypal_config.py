import os

import requests

# Las credenciales vienen del entorno (en produccion, las variables de Render).
# Estuvieron escritas en views.py y siguen en el historial de git: el secreto
# viejo hay que rotarlo en el panel de PayPal, no basta con borrarlo de aqui.
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")

BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")


def get_access_token():
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise RuntimeError("Faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el entorno.")

    response = requests.post(
        f"{BASE_URL}/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
        headers={"Accept": "application/json", "Accept-Language": "es_MX"},
        data={"grant_type": "client_credentials"},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()["access_token"]
