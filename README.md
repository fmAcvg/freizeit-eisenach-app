## EisenachApp – Projektüberblick und Startanleitung

### Überblick
Die App ist eine nichtkommerzielle Jugendplattform für das Thema „Aktuelle und zukünftige Stadtentwicklung in Eisenach und ihr Einfluss auf Aktivitäten für Jugendliche“. Technischer Stack: React Native (Expo) Frontend + Django REST Backend.

### Projektstruktur (wichtigste Verzeichnisse)
- backend/: Django-Projekt und API
  - eisenach_backend/: Django Settings/URLs
  - api/: Modelle, Views, URLs der REST-API und Admin-Dashboard
  - templates/admin/: Templates fürs Admin-Dashboard
  - staticfiles/: gesammelte statische Dateien (Dev)
  - media/: Medien (z. B. Avatar-/Eventbilder)
  - manage.py: Django CLI
  - config.py: Zentrale Entwicklungs-Konfiguration (Hosts/CORS etc.)
- frontend/EisenachApp_0.0.1/: Expo App
  - app/: Routendefinition (expo-router), Tabs, Screens
  - components/: UI-Komponenten (Karten, Inputs, Auth, Profile, etc.)
  - services/: API-Aufrufe zum Backend
  - config/: API-Basis-URL (dynamisch aus Expo-Host)
  - constants/, contexts/, hooks/: Thema, Auth, Hilfsfunktionen
  - assets/: Bilder
  - package.json: Frontend-Abhängigkeiten und Scripts
- start-app.bat: Hilfsskript zum lokalen Start (Windows)

### Wichtige Bereiche
- Backend-API Endpunkte liegen unter /api/ (z. B. /api/events/)
- Admin klassisch: /admin-classic/ – Custom Admin-Dashboard: /admin/
- Medien werden unter /media/ bereitgestellt, Bild-URLs kommen vom Backend

### Abhängigkeiten
Ohne Docker
- Python 3.11
- Node.js (LTS), npm
- Java (für Android-Emulator optional), Xcode (für iOS optional)

Python-Pakete (siehe backend/requirements.txt)
- Django, djangorestframework, django-cors-headers, dj-database-url u. a.

Mit Docker
- Docker Desktop (aktuelle Version)
- docker-compose

### Start (ohne Docker)
1) Backend
   - Windows PowerShell:
     
     ```bash
     cd backend
     venv\Scripts\activate
     pip install -r requirements.txt
     python manage.py migrate
     python create_superuser.py  # Superuser für Admin
     python manage.py runserver 0.0.0.0:8000
     ```
   - Admin öffnen: `http://<PC-IP>:8000/admin-classic/`
     (Hinweis: <PC-IP> ist die IPv4 deines Rechners im WLAN, z. B. 192.168.x.y. Auf Android-Emulator ggf. 10.0.2.2 verwenden.)

2) Frontend (neue PowerShell)
   - 
     ```bash
     cd frontend\EisenachApp_0.0.1
     npm install
     npm start
     ```
   - Expo im LAN-Modus ausführen (Gerät im gleichen WLAN). Die App erkennt die Host-IP automatisch aus Expo.

Alternativ: start-app.bat im Projektwurzelverzeichnis nutzen (Windows)

### Start (mit Docker) – grobe Schritte
1) .env / Konfiguration anpassen (falls nötig)
2) docker-compose up --build
3) Backend: Port 8000, Frontend je nach Setup (bei Expo meist lokal entwickelt)

### Kurze App-Beschreibung
- Feed: Öffentliche Events (ohne Anmeldung sichtbar)
- Event-Details: Öffentliche Infos; Teilnahme/Kommentare nur angemeldet
- Freunde: Nur nach Anmeldung (geschützt)
- Event einreichen: Nur nach Anmeldung (geschützt)
- Profil: Login/Profil-Ansicht; Profilbild-Upload, Datenschutzeinstellungen

### Hinweise
- Das Frontend erkennt die lokale IP aus der Expo-Host-URI und baut daraus automatisch die API-URL (`http://<host>:8000/api`). Bei WLAN-Wechsel funktioniert die App damit ohne manuelle Anpassung. Falls nötig, kannst du manuell `http://<PC-IP>:8000/api` verwenden; auf Android-Emulator ist `http://10.0.2.2:8000/api` die Loopback-Brücke.
- Im Debug-Modus erlaubt das Backend alle Hosts/CORS für einfaches Testen im LAN.


