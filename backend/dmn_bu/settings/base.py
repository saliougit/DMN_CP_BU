from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="dev-only-insecure-key")
DEBUG = False
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.classification",
    "apps.documents",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "dmn_bu.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "dmn_bu.wsgi.application"

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     config("DB_NAME",     default="dmn_bu"),
        "USER":     config("DB_USER",     default="dmn"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST":     config("DB_HOST",     default="db"),
        "PORT":     config("DB_PORT",     default="5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Dakar"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── DRF ──────────────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# ─── Redis / Cache ────────────────────────────────────────────────────────────

REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND":  "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS":  {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "dmn_bu",
    }
}

# ─── Celery ───────────────────────────────────────────────────────────────────

CELERY_BROKER_URL       = REDIS_URL
CELERY_RESULT_BACKEND   = REDIS_URL
CELERY_ACCEPT_CONTENT   = ["json"]
CELERY_TASK_SERIALIZER  = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE         = "Africa/Dakar"
CELERY_TASK_TRACK_STARTED = True

# ─── Email ────────────────────────────────────────────────────────────────────

_send_real_emails = config("SEND_REAL_EMAILS", default=False, cast=bool)
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if _send_real_emails
    else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST          = config("EMAIL_HOST",          default="smtp.gmail.com")
EMAIL_PORT          = config("EMAIL_PORT",          default=587, cast=int)
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = config("EMAIL_HOST_USER",     default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL  = config("DEFAULT_FROM_EMAIL",  default="noreply@budmnucad.sn")

# ─── JWT ──────────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME":   timedelta(days=30),
    "AUTH_HEADER_TYPES":        ("Bearer",),
    "ROTATE_REFRESH_TOKENS":    True,   # nouveau refresh token à chaque renouvellement
    "BLACKLIST_AFTER_ROTATION": True,   # l'ancien refresh est blacklisté immédiatement
    "UPDATE_LAST_LOGIN":        True,
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:3000"
).split(",")

# ─── Meilisearch ──────────────────────────────────────────────────────────────

MEILISEARCH_URL        = config("MEILI_URL",        default="http://search:7700")
MEILISEARCH_MASTER_KEY = config("MEILI_MASTER_KEY", default="")

# ─── MinIO ────────────────────────────────────────────────────────────────────
# Les mêmes variables (MINIO_ROOT_USER / MINIO_ROOT_PASSWORD) servent aussi
# au container MinIO dans docker-compose — une seule paire à gérer dans .env

MINIO_ENDPOINT   = config("MINIO_ENDPOINT",      default="localhost:9000")
MINIO_ACCESS_KEY = config("MINIO_ROOT_USER",     default="minioadmin")
MINIO_SECRET_KEY = config("MINIO_ROOT_PASSWORD", default="minioadmin")
MINIO_BUCKET     = config("MINIO_BUCKET",        default="dmn-documents")
