from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

# EMAIL_BACKEND est contrôlé par SEND_REAL_EMAILS dans .env :
#   SEND_REAL_EMAILS=True  → SMTP réel
#   SEND_REAL_EMAILS=False → logs console (défaut)

# MinIO activé même en développement — parité totale avec la production
# Démarrer MinIO localement : docker compose up storage storage-init -d
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "endpoint_url": f"http://{MINIO_ENDPOINT}",
            "access_key":   MINIO_ACCESS_KEY,
            "secret_key":   MINIO_SECRET_KEY,
            "bucket_name":  MINIO_BUCKET,
            "default_acl":  "private",
            "use_ssl":      False,
            "file_overwrite": False,
        },
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
