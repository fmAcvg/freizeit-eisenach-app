"""
URL configuration for eisenach_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Haupt-URL-Konfiguration für das gesamte Projekt
urlpatterns = [
    path('admin/', include('api.admin_urls')),  # Custom Admin-Dashboard
    path('admin-classic/', admin.site.urls),  # Standard Django Admin-Interface (als Backup)
    path('api/', include('api.urls')),  # Alle API-Endpunkte
]

# Media-Dateien und Static Files in Development-Modus servieren
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
