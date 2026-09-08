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
            "endpoint_url":  f"http://{MINIO_ENDPOINT}",
            "access_key":    MINIO_ACCESS_KEY,
            "secret_key":    MINIO_SECRET_KEY,
            "bucket_name":   MINIO_BUCKET,
            "default_acl":   "public-read",
            "use_ssl":       False,
            "file_overwrite": False,
            "url_protocol":  "http:",
            "custom_domain": f"{MINIO_PUBLIC_ENDPOINT}/{MINIO_BUCKET}",
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
