#!/usr/bin/env python
"""
Script zum Ändern des Admin-Passworts
Verwendet die zentrale Konfigurationsdatei config.py
"""

import os
import sys
import django

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eisenach_backend.settings')
django.setup()

from django.contrib.auth.models import User
from config import get_admin_config

def change_admin_password():
    """Ändert das Admin-Passwort basierend auf der Konfiguration"""
    admin_config = get_admin_config()
    
    username = admin_config['username']
    new_password = admin_config['password']
    
    try:
        # Benutzer finden
        user = User.objects.get(username=username)
        
        # Passwort ändern
        user.set_password(new_password)
        user.save()
        
        print(f"Admin-Passwort für '{username}' wurde erfolgreich geändert!")
        print(f"Neues Passwort: {new_password}")
        print("\nDu kannst dich jetzt im Admin-Interface anmelden unter:")
        print("   http://localhost:8000/admin/")
        
        return True
        
    except User.DoesNotExist:
        print(f"Admin-Benutzer '{username}' wurde nicht gefunden!")
        print("Führe zuerst 'python create_superuser.py' aus")
        return False
    except Exception as e:
        print(f"Fehler beim Ändern des Passworts: {e}")
        return False

def show_current_config():
    """Zeigt die aktuelle Konfiguration an"""
    admin_config = get_admin_config()
    
    print("Aktuelle Admin-Konfiguration:")
    print(f"   Benutzername: {admin_config['username']}")
    print(f"   E-Mail: {admin_config['email']}")
    print(f"   Passwort: {admin_config['password']}")
    print(f"   Name: {admin_config.get('first_name', '')} {admin_config.get('last_name', '')}")
    
    print("\nKonfiguration ändern:")
    print("   1. Öffne backend/config.py")
    print("   2. Ändere das 'password' Feld in ADMIN_CONFIG")
    print("   3. Führe dieses Script erneut aus")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--show":
        show_current_config()
    else:
        change_admin_password()
