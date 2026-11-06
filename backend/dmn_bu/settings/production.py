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

# Par défaut (DEBUG=False), Django n'envoie les erreurs 500 que par mail
# (mail_admins) — jamais configuré ici, donc elles disparaissaient
# silencieusement : rien dans `docker logs`. On force un handler console
# systematique pour que toute exception serveur finisse dans les logs gunicorn.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
    # Toute erreur loggee par le code applicatif (apps.*) passe par ici —
    # sans ca, un logger.exception() dans une app ne remonte nulle part
    # (root logger non configure = silence, hors cas particulier de
    # logging.lastResort qui ne couvre pas tous les contextes gunicorn).
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}

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
