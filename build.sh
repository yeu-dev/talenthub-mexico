#!/usr/bin/env bash
# Salir si hay algún error
set -o errexit

echo "Instalando dependencias..."
pip install -r requirements.txt

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --no-input

echo "Aplicando migraciones a la base de datos..."
python manage.py migrate

# Las empresas de demostración (100, con ~240 vacantes). El comando no
# duplica: en el primer deploy las crea y en los siguientes solo avisa que ya
# existen. Va aquí porque el Shell de Render es de pago en el plan gratis.
echo "Sembrando empresas de demostración..."
python manage.py sembrar_empresas
