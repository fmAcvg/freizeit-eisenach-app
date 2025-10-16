# -*- coding: utf-8 -*-
"""
Zentrale Konfigurationsdatei für das Eisenach Backend
Hier können alle wichtigen Einstellungen geändert werden
"""

import os
from django.conf import settings

# ============================================================================
# ADMIN KONFIGURATION
# ============================================================================

# Admin Superuser Einstellungen
ADMIN_CONFIG = {
    'username': 'admin',
    'email': 'admin@eisenach-app.de',
    'password': 'admin123',  # Einfaches Passwort für Entwicklung
    'first_name': 'Eisenach',
    'last_name': 'Administrator',
}

# ============================================================================
# API KONFIGURATION
# ============================================================================

# API Einstellungen
API_CONFIG = {
    'page_size': 20,  # Anzahl Events pro Seite
    'max_page_size': 100,  # Maximale Events pro Seite
    'default_timeout': 30,  # Timeout für API-Requests in Sekunden
}

# ============================================================================
# SECURITY KONFIGURATION
# ============================================================================

# Sicherheits-Einstellungen
SECURITY_CONFIG = {
    'token_expire_hours': 24,  # Token-Ablaufzeit in Stunden
    'password_min_length': 8,  # Mindestlänge für Passwörter
    'max_login_attempts': 5,  # Maximale Login-Versuche
}

# ============================================================================
# DATABASE KONFIGURATION
# ============================================================================

# Datenbank-Einstellungen
DATABASE_CONFIG = {
    'auto_create_superuser': True,  # Superuser automatisch erstellen
    'auto_migrate': True,  # Automatische Migrationen
    'create_dummy_data': True,  # Dummy-Daten erstellen
}

# ============================================================================
# DEVELOPMENT KONFIGURATION
# ============================================================================

# Entwicklungseinstellungen
DEV_CONFIG = {
    'debug': True,  # Debug-Modus
    # Einheitliche Basis-URLs (immer 192er Adresse verwenden)
    # Hinweis: API-Port ist 8000 (Django), Expo/Frontend ist 8081 (Metro)
    'api_base_url': 'http://192.168.2.120:8000/api',
    'frontend_base_url': 'exp://192.168.2.120:8081',  # Expo-Gerätelink
    'frontend_web_url': 'http://192.168.2.120:8081',  # Metro-Webserver

    # CORS-Whitelist: Von wo das Frontend Anfragen schicken darf
    'cors_allowed_origins': [
        # Lokalhost lassen wir fürs Debugging drin, aber die 192er ist Standard
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.2.120:3000',  # Web-Frontend-Port
        'http://192.168.2.120:8081',  # Metro-Web
        'exp://192.168.2.120:8081',   # Expo auf Handy
    ],

    # Hosts, unter denen das Backend erreichbar ist
    'allowed_hosts': [
        'localhost',
        '127.0.0.1',
        '192.168.2.120',  # 192er Adresse immer erlauben
        '0.0.0.0',
    ],
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_admin_config():
    """Gibt die Admin-Konfiguration zurück"""
    return ADMIN_CONFIG.copy()

def get_api_config():
    """Gibt die API-Konfiguration zurück"""
    return API_CONFIG.copy()

def get_security_config():
    """Gibt die Sicherheits-Konfiguration zurück"""
    return SECURITY_CONFIG.copy()

def get_database_config():
    """Gibt die Datenbank-Konfiguration zurück"""
    return DATABASE_CONFIG.copy()

def get_dev_config():
    """Gibt die Entwicklungskonfiguration zurück"""
    return DEV_CONFIG.copy()

# ============================================================================
# ENVIRONMENT VARIABLES OVERRIDE
# ============================================================================

# Umgebungsvariablen können die Konfiguration überschreiben
if os.getenv('ADMIN_PASSWORD'):
    ADMIN_CONFIG['password'] = os.getenv('ADMIN_PASSWORD')

if os.getenv('ADMIN_USERNAME'):
    ADMIN_CONFIG['username'] = os.getenv('ADMIN_USERNAME')

if os.getenv('ADMIN_EMAIL'):
    ADMIN_CONFIG['email'] = os.getenv('ADMIN_EMAIL')

if os.getenv('DEBUG') == 'False':
    DEV_CONFIG['debug'] = False

# ============================================================================
# CONFIGURATION VALIDATION
# ============================================================================

def validate_config():
    """Validiert die Konfiguration"""
    errors = []
    
    # Admin-Passwort validieren
    if len(ADMIN_CONFIG['password']) < 8:
        errors.append("Admin-Passwort muss mindestens 8 Zeichen lang sein")
    
    # E-Mail validieren
    if '@' not in ADMIN_CONFIG['email']:
        errors.append("Admin-E-Mail ist ungültig")
    
    if errors:
        raise ValueError("Konfigurationsfehler: " + ", ".join(errors))
    
    return True

# Konfiguration beim Import validieren
try:
    validate_config()
except ValueError as e:
    print(f"Konfigurationsfehler: {e}")
    print("Bitte überprüfe die config.py Datei")
