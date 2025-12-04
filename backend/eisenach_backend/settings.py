"""
einfache einstellungen für unser django backend
fokus liegt auf entwicklung, damit alles schnell und verständlich läuft
"""

from pathlib import Path
import os

# basis pfad zum projekt (praktisch für relative pfade)
BASE_DIR = Path(__file__).resolve().parent.parent

# eigene konfiguration laden (falls vorhanden), sonst sinnvolle defaults
try:
    from config import get_dev_config
    dev_config = get_dev_config()
except ImportError:
    # fallback wenn config.py fehlt
    dev_config = {
        'debug': True,
        'allowed_hosts': ['localhost', '127.0.0.1', '192.168.2.120'],
        'cors_allowed_origins': [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.168.2.120:3000',
            'exp://192.168.2.120:8081',
        ]
    }

# vorsicht: das hier ist für entwicklung, in produktion bitte härter absichern

# wichtig: secret key in produktion geheim halten
SECRET_KEY = 'django-insecure-vs@+6h@19aeqoir4acz&j+3n9%v%6!d_u4zvs0q_sqg&!zdy(4'

# debug in produktion aus machen, sonst gibt’s peinliche fehlerseiten
DEBUG = dev_config['debug']

# in dev alle hosts erlauben (wlan ip wechselt gern mal)
if dev_config.get('debug', True):
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = dev_config.get('allowed_hosts', [])

# beim start kurz anzeigen, welche urls wir nutzen (hilft beim testen)
api_base = dev_config.get('api_base_url', 'http://192.168.2.120:8000/api')
frontend_exp = dev_config.get('frontend_base_url', 'exp://192.168.2.120:8081')
frontend_web = dev_config.get('frontend_web_url', 'http://192.168.2.120:8081')
print(f"API: {api_base} | Frontend(Expo): {frontend_exp} | Frontend(Web): {frontend_web}")


# app konfiguration

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'eisenach_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Custom Admin-Templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eisenach_backend.wsgi.application'


# datenbank

# wenn DATABASE_URL gesetzt ist -> postgres (z.b. docker), sonst sqlite lokal
if os.getenv('DATABASE_URL'):
    # docker/produktion: nutze postgres
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.getenv('DATABASE_URL'))
    }
else:
    # lokale entwicklung: sqlite reicht völlig aus
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# passwort prüfungen (standards von django, lassen wir so)

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# sprache/zeit (standard)

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# statische dateien (wo static liegt)

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# zusätzliche static pfade (brauchen wir aktuell nicht)
STATICFILES_DIRS = []

# uploads (medien)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# standard primärschlüssel

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# rest framework einstellungen (auth, rechte, paging, parser)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',  # normale django sessions
        'rest_framework.authentication.TokenAuthentication',  # tokens für die app
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',  # lesen für alle, schreiben nur eingeloggt
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',  # seitenweise anzeige
    'PAGE_SIZE': 20,  # 20 einträge pro seite
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',  # für uploads
        'rest_framework.parsers.FormParser',  # für formular-daten
    ],
}

# cors: in dev großzügig, sonst per liste
if dev_config.get('debug', True):
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = dev_config.get('cors_allowed_origins', [])
    CSRF_TRUSTED_ORIGINS = dev_config.get('csrf_trusted_origins', [])
else:
    CORS_ALLOWED_ORIGINS = dev_config['cors_allowed_origins']
    CSRF_TRUSTED_ORIGINS = dev_config.get('csrf_trusted_origins', [])

CORS_ALLOW_CREDENTIALS = True  # cookies/autorisation mitschicken erlauben

# private netzwerke erlauben (wichtig fürs handy im wlan)
CORS_ALLOW_PRIVATE_NETWORK = True

# e-mail einstellungen (yahoo smtp, reicht für verifikation)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.mail.yahoo.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '465'))
EMAIL_USE_TLS = False
EMAIL_USE_SSL = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'eisenachappverify@yahoo.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'Eisenachappverify24334')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
