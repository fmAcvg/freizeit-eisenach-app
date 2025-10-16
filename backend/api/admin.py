from django.contrib import admin
from django.utils import timezone
from .models import (
    Event, EventParticipant, EventLike, EventComment, 
    Friendship, FriendshipRequest, UserRole, Profile, UserReport
)

# Hier konfiguriere ich das Django Admin-Interface für unsere Modelle
# Das Admin-Interface erlaubt es, Daten über eine Web-Oberfläche zu verwalten

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Veranstaltungen
    list_display = ['title', 'location', 'date', 'status', 'created_by', 'created_at', 'participant_count', 'image_preview']  # Welche Spalten werden angezeigt?
    list_filter = ['status', 'date', 'created_at']  # Nach welchen Feldern kann gefiltert werden?
    search_fields = ['title', 'description', 'location']  # In welchen Feldern kann gesucht werden?
    readonly_fields = ['created_at', 'updated_at', 'participant_count', 'image_preview']  # Welche Felder sind schreibgeschützt?
    actions = ['approve_events', 'reject_events', 'publish_events']
    
    fieldsets = (
        ('Grundinformationen', {
            'fields': ('title', 'description', 'location', 'date', 'cost', 'contact_info')
        }),
        ('Einstellungen', {
            'fields': ('status', 'max_guests', 'min_age', 'image', 'image_url')
        }),
        ('Bild-Vorschau', {
            'fields': ('image_preview',),
            'classes': ('collapse',)
        }),
        ('Erstellt von', {
            'fields': ('created_by', 'created_at', 'updated_at', 'published_at')
        }),
        ('Statistiken', {
            'fields': ('participant_count',),
            'classes': ('collapse',)
        }),
    )
    
    def participant_count(self, obj):
        """Anzahl der Teilnehmer anzeigen"""
        return obj.participants.count()
    participant_count.short_description = 'Teilnehmer'
    
    def image_preview(self, obj):
        """Bild-Vorschau im Admin anzeigen"""
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-height: 200px; max-width: 300px; border-radius: 8px;" />'
        elif obj.image_url:
            return f'<img src="{obj.image_url}" style="max-height: 200px; max-width: 300px; border-radius: 8px;" />'
        return "Kein Bild vorhanden"
    image_preview.short_description = 'Bild-Vorschau'
    image_preview.allow_tags = True
    
    def approve_events(self, request, queryset):
        """Events akzeptieren und veröffentlichen"""
        updated = queryset.filter(status='pending').update(
            status='published',
            published_at=timezone.now()
        )
        self.message_user(request, f'{updated} Events wurden akzeptiert und veröffentlicht.')
    approve_events.short_description = "Ausgewählte Events akzeptieren"
    
    def reject_events(self, request, queryset):
        """Events ablehnen (Status auf cancelled setzen)"""
        updated = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(request, f'{updated} Events wurden abgelehnt.')
    reject_events.short_description = "Ausgewählte Events ablehnen"
    
    def publish_events(self, request, queryset):
        """Events direkt veröffentlichen"""
        updated = queryset.update(
            status='published',
            published_at=timezone.now()
        )
        self.message_user(request, f'{updated} Events wurden veröffentlicht.')
    publish_events.short_description = "Ausgewählte Events veröffentlichen"

@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Veranstaltungsteilnehmer
    list_display = ['user', 'event', 'joined_at']  # Anzeige: Benutzer, Veranstaltung, Beitrittsdatum
    list_filter = ['joined_at', 'event__date']  # Filter: Beitrittsdatum, Veranstaltungsdatum
    search_fields = ['user__username', 'event__title']  # Suche: Benutzername, Veranstaltungstitel

@admin.register(EventLike)
class EventLikeAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Event-Likes
    list_display = ['user', 'event', 'created_at']  # Anzeige: Benutzer, Event, Like-Datum
    list_filter = ['created_at']  # Filter: Like-Datum
    search_fields = ['user__username', 'event__title']  # Suche: Benutzername, Event-Titel

@admin.register(EventComment)
class EventCommentAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Event-Kommentare
    list_display = ['author', 'event', 'created_at']  # Anzeige: Autor, Event, Kommentar-Datum
    list_filter = ['created_at']  # Filter: Kommentar-Datum
    search_fields = ['author__username', 'event__title', 'text']  # Suche: Autor, Event-Titel, Text

@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Freundschaften
    list_display = ['user1', 'user2', 'created_at']  # Anzeige: Benutzer 1, Benutzer 2, Freundschaftsdatum
    list_filter = ['created_at']  # Filter: Freundschaftsdatum
    search_fields = ['user1__username', 'user2__username']  # Suche: Benutzernamen

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Benutzerrollen
    list_display = ['user', 'role', 'created_at']  # Anzeige: Benutzer, Rolle, Vergabe-Datum
    list_filter = ['role', 'created_at']  # Filter: Rolle, Vergabe-Datum
    search_fields = ['user__username']  # Suche: Benutzername

# Benachrichtigungen sind in dieser Version deaktiviert; keine Admin-Registrierung

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Benutzerprofile
    list_display = ['user', 'status', 'created_at']  # Anzeige: Benutzer, Status, Erstellungsdatum
    list_filter = ['status', 'created_at']  # Filter: Status, Erstellungsdatum
    search_fields = ['user__username', 'bio', 'location']  # Suche: Benutzername, Bio, Ort
    readonly_fields = ['created_at', 'updated_at']  # Automatische Felder sind schreibgeschützt

@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Nutzer-Meldungen
    list_display = ['reporter', 'reported_user', 'event', 'reason', 'status', 'created_at']
    list_filter = ['reason', 'status', 'created_at']
    search_fields = ['reporter__username', 'reported_user__username', 'event__title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['mark_resolved', 'mark_dismissed']
    
    fieldsets = (
        ('Report-Details', {
            'fields': ('reporter', 'reported_user', 'event', 'reason', 'description')
        }),
        ('Status', {
            'fields': ('status', 'admin_notes', 'resolved_at')
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def mark_resolved(self, request, queryset):
        """Reports als erledigt markieren"""
        updated = queryset.update(
            status='resolved',
            resolved_at=timezone.now(),
            admin_notes=f"Resolved by {request.user.username} at {timezone.now()}"
        )
        self.message_user(request, f'{updated} Reports wurden als erledigt markiert.')
    mark_resolved.short_description = "Ausgewählte Reports als erledigt markieren"
    
    def mark_dismissed(self, request, queryset):
        """Reports ablehnen"""
        updated = queryset.update(
            status='dismissed',
            resolved_at=timezone.now(),
            admin_notes=f"Dismissed by {request.user.username} at {timezone.now()}"
        )
        self.message_user(request, f'{updated} Reports wurden abgelehnt.')
    mark_dismissed.short_description = "Ausgewählte Reports ablehnen"

@admin.register(FriendshipRequest)
class FriendshipRequestAdmin(admin.ModelAdmin):
    # Admin-Konfiguration für Freundschafts-Anfragen
    list_display = ['from_user', 'to_user', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['from_user__username', 'to_user__username', 'from_user__first_name', 'to_user__first_name']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['accept_requests', 'decline_requests', 'cancel_requests']
    
    fieldsets = (
        ('Anfrage-Details', {
            'fields': ('from_user', 'to_user', 'status', 'message')
        }),
        ('Zeitstempel', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def accept_requests(self, request, queryset):
        """Freundschafts-Anfragen annehmen und Freundschaft erstellen"""
        for friend_request in queryset.filter(status='pending'):
            # Freundschaft erstellen
            from .models import Friendship
            Friendship.objects.get_or_create(
                user1=friend_request.from_user,
                user2=friend_request.to_user
            )
            # Status auf 'accepted' setzen
            friend_request.status = 'accepted'
            friend_request.save()
        
        updated = queryset.filter(status='pending').count()
        self.message_user(request, f'{updated} Freundschafts-Anfragen wurden angenommen.')
    accept_requests.short_description = "Ausgewählte Anfragen annehmen"
    
    def decline_requests(self, request, queryset):
        """Freundschafts-Anfragen ablehnen"""
        updated = queryset.filter(status='pending').update(status='declined')
        self.message_user(request, f'{updated} Freundschafts-Anfragen wurden abgelehnt.')
    decline_requests.short_description = "Ausgewählte Anfragen ablehnen"
    
    def cancel_requests(self, request, queryset):
        """Freundschafts-Anfragen stornieren"""
        updated = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(request, f'{updated} Freundschafts-Anfragen wurden storniert.')
    cancel_requests.short_description = "Ausgewählte Anfragen stornieren"
