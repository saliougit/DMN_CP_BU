from .base import *

DEBUG = False

# Sécurité — Nginx termine SSL en amont
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE    = True
SECURE_BROWSER_XSS_FILTER   = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Fichiers uploadés → MinIO (API S3 interne au réseau Docker)
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "endpoint_url": f"http://{MINIO_ENDPOINT}",
            "access_key":   MINIO_ACCESS_KEY,
            "secret_key":   MINIO_SECRET_KEY,
            "bucket_name":  MINIO_BUCKET,
            "default_acl":  "private",
            "use_ssl":      False,   # MinIO est en HTTP interne ; Nginx gère HTTPS en amont
            "file_overwrite": False,
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
