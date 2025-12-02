# -*- coding: utf-8 -*-
"""
einfacher überblick über die wichtigsten einstellungen fürs backend
hier stell ich nur die werte ein, die wir in der entwicklung wirklich brauchen
"""

import os
from django.conf import settings

# admin einstellungen (nur für entwicklung, sonst bitte env benutzen)
ADMIN_CONFIG = {
    'username': 'admin',
    'email': 'admin@eisenach-app.de',
    'password': 'admin123',  # nur für dev, in echt natürlich ändern :)
    'first_name': 'Eisenach',
    'last_name': 'Administrator',
}

# api grundwerte, damit paginierung und timeouts konsistent sind
API_CONFIG = {
    'page_size': 20,  # wie viele elemente pro seite
    'max_page_size': 100,  # obergrenze falls jemand übertreibt
    'default_timeout': 30,  # sekunden bis ein request abbricht
}

# sicherheitseinstellungen in klein und simpel gehalten
SECURITY_CONFIG = {
    'token_expire_hours': 24,  # login token läuft nach 24h ab
    'password_min_length': 8,  # passwort sollte mindestens 8 zeichen haben
    'max_login_attempts': 5,  # zu viele versuche -> sperre kurz
}

# datenbank verhalten beim start (nur dev-qualität)
DATABASE_CONFIG = {
    'auto_create_superuser': True,  # superuser automatisch anlegen
    'auto_migrate': True,  # migrationen beim start durchlaufen lassen
    'create_dummy_data': True,  # testdaten erzeugen (macht die app direkt nutzbar)
}

# dev-einstellungen: ip/ports und was im wlan so gebraucht wird
DEV_CONFIG = {
    'debug': False,  # debug-modus (in prod bitte aus)
    # basis-urls: wir nutzen die 192er ip, damit handy im wlan drankommt
    # api läuft auf 8000, metro/expo auf 8081
    'api_base_url': 'http://192.168.2.120:8000/api',
    'frontend_base_url': 'exp://192.168.2.120:8081',  # expo link fürs handy
    'frontend_web_url': 'http://192.168.2.120:8081',  # metro webserver

    # cors: von hier darf das frontend requests schicken
    'cors_allowed_origins': [
        # localhost lassen wir drin, aber die 192er ist unser standard
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.2.120:3000',  # web-frontend port
        'http://192.168.2.120:8081',  # metro web
        'exp://192.168.2.120:8081',   # expo aufm handy
    ],

    # hosts, unter denen das backend erreichbar ist
    'allowed_hosts': [
        'localhost',
        '127.0.0.1',
        '192.168.2.120',  # 192er adresse immer erlauben
        '0.0.0.0',
    ],
}

# kleine helper funktionen, die einfach nur kopien der config liefern
def get_admin_config():
    """gibt admin einstellungen zurück (kopie, damit nichts kaputt geht)"""
    return ADMIN_CONFIG.copy()

def get_api_config():
    """gibt api einstellungen zurück"""
    return API_CONFIG.copy()

def get_security_config():
    """gibt sicherheits einstellungen zurück"""
    return SECURITY_CONFIG.copy()

def get_database_config():
    """gibt datenbank einstellungen zurück"""
    return DATABASE_CONFIG.copy()

def get_dev_config():
    """gibt dev einstellungen zurück"""
    return DEV_CONFIG.copy()

# env-variablen können werte überschreiben (praktisch im serverbetrieb)
if os.getenv('ADMIN_PASSWORD'):
    ADMIN_CONFIG['password'] = os.getenv('ADMIN_PASSWORD')

if os.getenv('ADMIN_USERNAME'):
    ADMIN_CONFIG['username'] = os.getenv('ADMIN_USERNAME')

if os.getenv('ADMIN_EMAIL'):
    ADMIN_CONFIG['email'] = os.getenv('ADMIN_EMAIL')

# DEBUG aus Umgebungsvariablen robust auslesen
# Akzeptiert: 1/true/yes/on => True, 0/false/no/off => False
_env_debug = os.getenv('DEBUG')
if _env_debug is not None:
    DEV_CONFIG['debug'] = str(_env_debug).strip().lower() in ('1', 'true', 'yes', 'on')

# einfache prüfung damit wir uns nicht mit blöden typos selbst ärgern
def validate_config():
    """checkt die wichtigsten werte, damit nix peinlich schief geht"""
    errors = []
    
    # admin passwort grob prüfen
    if len(ADMIN_CONFIG['password']) < 8:
        errors.append("admin-passwort muss mindestens 8 zeichen lang sein")
    
    # e-mail prüfen (nur ganz simpel)
    if '@' not in ADMIN_CONFIG['email']:
        errors.append("admin e-mail ist ungültig")
    
    if errors:
        raise ValueError("konfig fehler: " + ", ".join(errors))
    
    return True

# beim import einmal checken und freundliche meldung ausgeben
try:
    validate_config()
except ValueError as e:
    print(f"konfigurationsfehler: {e}")
    print("bitte die config.py einmal prüfen, danke")
