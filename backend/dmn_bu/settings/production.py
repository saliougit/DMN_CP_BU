from .base import *

DEBUG = False

# Sécurité (Nginx gère SSL en amont)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Stockage fichiers sur MinIO via API S3
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "endpoint_url": f"http://{MINIO_ENDPOINT}",
            "access_key":   MINIO_ACCESS_KEY,
            "secret_key":   MINIO_SECRET_KEY,
            "bucket_name":  MINIO_BUCKET,
            "default_acl":  "private",
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
