# Docker Setup für Eisenach Backend

## Schneller Start

```bash
# Backend mit Docker starten
docker-compose up --build

# Im Hintergrund starten
docker-compose up -d --build
```

## URLs

- **API:** http://localhost:8000/api/
- **Admin:** http://localhost:8000/admin/

## Admin Login

- **Benutzername:** admin
- **Passwort:** eisenach2024

## Befehle

```bash
# Container stoppen
docker-compose down

# Logs anzeigen
docker-compose logs

# In Container einsteigen
docker-compose exec web bash

# Datenbank zurücksetzen
docker-compose down -v
docker-compose up --build
```

## Datenbank

- **Datenbank:** eisenach_db
- **Benutzer:** eisenach_user
- **Passwort:** eisenach_password

Die Daten werden in einem Docker Volume gespeichert und bleiben auch nach dem Stoppen der Container erhalten.
