from .base import *

DEBUG = False

# Sécurité — Nginx termine SSL en amont
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE    = True
SECURE_BROWSER_XSS_FILTER   = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Nginx (sur l'hôte) relaie /minio/ en HTTPS vers le domaine public —
# les URLs renvoyées au frontend doivent donc être en https, même si la
# connexion interne backend → conteneur MinIO reste en http (réseau Docker).
CSRF_TRUSTED_ORIGINS = [
    f"https://{host}" for host in ALLOWED_HOSTS if host not in ("localhost", "127.0.0.1")
]

# Fichiers uploadés → MinIO (API S3 interne au réseau Docker)
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "endpoint_url":  f"http://{MINIO_ENDPOINT}",
            "access_key":    MINIO_ACCESS_KEY,
            "secret_key":    MINIO_SECRET_KEY,
            "bucket_name":   MINIO_BUCKET,
            "default_acl":   "public-read",
            "use_ssl":       False,
            "file_overwrite": False,
            "url_protocol":  "https:",
            "custom_domain": f"{MINIO_PUBLIC_ENDPOINT}/{MINIO_BUCKET}",
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
