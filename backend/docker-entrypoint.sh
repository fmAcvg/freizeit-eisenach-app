#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python create_superuser.py

# Start the server
echo "Starting Django server..."
exec "$@"
