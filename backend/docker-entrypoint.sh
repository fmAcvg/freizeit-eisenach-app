#!/bin/bash
set -e

echo "starte backend initialisierung (sqlite, keine externe db)..."

echo "führe migrationen aus..."
python manage.py migrate --noinput

echo "sammle statische dateien..."
python manage.py collectstatic --noinput

echo "erstelle superuser (falls nicht vorhanden)..."
python create_superuser.py || true

echo "erstelle dummy daten..."
python create_dummy_data.py || true

echo "starte django server..."
exec "$@"
