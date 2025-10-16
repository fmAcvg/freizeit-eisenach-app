#!/usr/bin/env python
"""
Django Superuser Erstellungsscript
Erstellt automatisch einen Superuser für die Eisenach App
Verwendet die zentrale Konfigurationsdatei config.py
"""

import os
import sys
import django

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eisenach_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Konfiguration importieren
from config import get_admin_config

def create_superuser():
    """Erstellt einen Superuser für die App"""
    admin_config = get_admin_config()
    
    username = admin_config['username']
    email = admin_config['email']
    password = admin_config['password']
    first_name = admin_config.get('first_name', '')
    last_name = admin_config.get('last_name', '')

    if User.objects.filter(username=username).exists():
        print(f"Superuser '{username}' existiert bereits!")
        return False
    else:
        user = User.objects.create_superuser(username, email, password)
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        
        print(f"Superuser '{username}' wurde erfolgreich erstellt!")
        print(f"Benutzername: {username}")
        print(f"E-Mail: {email}")
        print(f"Passwort: {password}")
        print("\nDu kannst dich jetzt im Admin-Interface anmelden unter:")
        print("   http://localhost:8000/admin/")
        return True

if __name__ == "__main__":
    create_superuser()
