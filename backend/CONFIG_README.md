# 🔧 Backend Konfiguration

## 📁 Zentrale Konfigurationsdatei

Alle wichtigen Backend-Einstellungen findest du in der Datei:
```
backend/config.py
```

## 🔑 Admin-Passwort ändern

### Schnelle Änderung:
1. Öffne `backend/config.py`
2. Suche nach `ADMIN_CONFIG`
3. Ändere das `password` Feld:

```python
ADMIN_CONFIG = {
    'username': 'admin',
    'email': 'admin@eisenach-app.de',
    'password': 'DEIN_NEUES_PASSWORT_HIER',  # ← Hier ändern!
    'first_name': 'Eisenach',
    'last_name': 'Administrator',
}
```

### Mit Umgebungsvariablen (sicherer):
```bash
# Windows PowerShell
$env:ADMIN_PASSWORD="DeinNeuesPasswort123!"

# Linux/Mac
export ADMIN_PASSWORD="DeinNeuesPasswort123!"
```

## 🌐 IP-Adresse für Mobile ändern

Falls sich deine lokale IP-Adresse ändert:

1. Öffne `backend/config.py`
2. Suche nach `DEV_CONFIG`
3. Ändere die `allowed_hosts` und `cors_allowed_origins`:

```python
DEV_CONFIG = {
    'allowed_hosts': [
        'localhost',
        '127.0.0.1',
        '<LAN-IP>',  # ← Deine neue IP hier (z. B. 192.168.x.y)
        '0.0.0.0',
    ],
    'cors_allowed_origins': [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://<LAN-IP>:3000',  # ← Deine neue IP hier
        'exp://<LAN-IP>:8081',   # ← Deine neue IP hier
    ],
}
```

## ⚙️ Andere wichtige Einstellungen

### API-Einstellungen:
```python
API_CONFIG = {
    'page_size': 20,  # Events pro Seite
    'max_page_size': 100,  # Maximale Events
    'default_timeout': 30,  # Timeout in Sekunden
}
```

### Sicherheits-Einstellungen:
```python
SECURITY_CONFIG = {
    'token_expire_hours': 24,  # Token-Ablaufzeit
    'password_min_length': 8,  # Mindestlänge Passwort
    'max_login_attempts': 5,   # Maximale Login-Versuche
}
```

## 🔄 Nach Änderungen

Nach dem Ändern der Konfiguration:

1. **Backend neu starten:**
   ```bash
   # Windows
   .\start-app.bat

   # Oder manuell
   cd backend
   .\venv\Scripts\Activate.ps1
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Superuser neu erstellen** (falls Passwort geändert):
   ```bash
   cd backend
   python create_superuser.py
   ```

## 📝 Wichtige Dateien

- **`config.py`** - Zentrale Konfiguration
- **`create_superuser.py`** - Superuser-Erstellung
- **`settings.py`** - Django-Einstellungen
- **`requirements.txt`** - Python-Abhängigkeiten

## 🚨 Sicherheit

- **Niemals** Passwörter in Git committen!
- Verwende Umgebungsvariablen für sensible Daten
- Ändere das Admin-Passwort nach der ersten Einrichtung

## 🆘 Hilfe

Bei Problemen:
1. Überprüfe die `config.py` auf Syntax-Fehler
2. Starte das Backend neu
3. Schaue in die Konsolen-Ausgabe für Fehlermeldungen
