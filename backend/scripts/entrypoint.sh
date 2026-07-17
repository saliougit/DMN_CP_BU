#!/bin/sh
set -e

echo ">>> Attente de la base de données..."
python - <<'EOF'
import sys, time, os
import psycopg2

params = dict(
    host=os.environ.get("DB_HOST", "db"),
    port=os.environ.get("DB_PORT", "5432"),
    dbname=os.environ.get("DB_NAME", "dmn_bu"),
    user=os.environ.get("DB_USER", "dmn"),
    password=os.environ.get("DB_PASSWORD", ""),
)
for i in range(30):
    try:
        psycopg2.connect(**params)
        print("Base de données prête.")
        break
    except psycopg2.OperationalError:
        print(f"Tentative {i+1}/30 — base non disponible, attente...")
        time.sleep(2)
else:
    print("ERREUR : impossible de se connecter à la base de données.")
    sys.exit(1)
EOF

echo ">>> Migrations..."
python manage.py migrate --noinput

echo ">>> Collecte des fichiers statiques..."
python manage.py collectstatic --noinput --clear

echo ">>> Démarrage Gunicorn..."
exec gunicorn dmn_bu.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
