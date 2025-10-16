from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import authentication

# Hier definiere ich alle URL-Muster für die API
# Jede URL zeigt an, welche View aufgerufen werden soll

# Router für ViewSets (falls wir später welche hinzufügen)
router = DefaultRouter()

urlpatterns = [
    # API-Übersicht
    path('', views.api_root, name='api-root'),  # Zeigt alle verfügbaren Endpunkte
    path('health/', views.health, name='api-health'),  # Einfacher Health-Check
    
    # Authentifizierung
    path('auth/login/', authentication.login_view, name='login'),  # Benutzer anmelden
    path('auth/register/', authentication.register_view, name='register'),  # Benutzer registrieren
    path('auth/logout/', authentication.logout_view, name='logout'),  # Benutzer abmelden
    path('auth/profile/', authentication.user_profile_view, name='user-profile'),  # Aktuelles Profil
    path('auth/profile/image/', authentication.upload_profile_image, name='upload-profile-image'),  # Profilbild hochladen
    path('auth/profile/image/delete/', authentication.delete_profile_image, name='delete-profile-image'),  # Profilbild löschen
    # Passwort zurücksetzen
    path('auth/password-reset/', authentication.password_reset_request, name='password-reset-request'),
    path('auth/password-reset/confirm/', authentication.password_reset_confirm, name='password-reset-confirm'),
    path('auth/password-reset/confirm-code/', authentication.password_reset_confirm_code, name='password-reset-confirm-code'),
    
    # Veranstaltungen
    path('events/', views.EventListCreateView.as_view(), name='event-list-create'),  # Alle Veranstaltungen anzeigen/erstellen
    path('events/friends/', views.FriendEventsListView.as_view(), name='event-list-friends'),  # Events mit Freunden
    
    # Meine Events (müssen vor den spezifischen Event-URLs stehen)
    path('events/my-created/', views.MyCreatedEventsView.as_view(), name='my-created-events'),  # Events die ich erstellt habe
    path('events/my-participated/', views.MyParticipatedEventsView.as_view(), name='my-participated-events'),  # Events an denen ich teilnehme
    
    # Event Analytics
    path('events/<int:event_id>/age-analytics/', views.event_age_analytics, name='event-age-analytics'),  # Altersverteilung eines Events
    
    # Test-Endpunkt für Debugging
    path('events/test/', views.api_root, name='events-test'),
    
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),  # Bestimmte Veranstaltung anzeigen/bearbeiten/löschen
    
    # Event-Likes (Toggle)
    path('events/<int:event_id>/likes/', views.EventLikeToggleView.as_view(), name='event-like-toggle'),  # Like toggeln
    
    # Event-Kommentare
    path('events/<int:event_id>/comments/', views.EventCommentListCreateView.as_view(), name='event-comment-list-create'),  # Kommentare anzeigen/erstellen
    path('comments/<int:comment_id>/report/', views.report_comment, name='comment-report'),  # Kommentar melden
    path('comments/<int:pk>/', views.EventCommentDestroyView.as_view(), name='event-comment-destroy'),  # Kommentar löschen
    
    # Veranstaltungsteilnehmer
    path('events/<int:event_id>/participants/', 
         views.EventParticipantListCreateView.as_view(), 
         name='event-participant-list-create'),  # Teilnehmer anzeigen/beitreten
    path('events/<int:event_id>/participants/<int:pk>/', 
         views.EventParticipantDestroyView.as_view(), 
         name='event-participant-destroy'),  # Veranstaltung verlassen
    
    # Benutzerprofile
    path('profiles/', views.ProfileDetailUpdateView.as_view(), name='profile-detail-update'),  # Eigenes Profil anzeigen/bearbeiten
    path('profile/<int:user_id>/', views.profile_detail, name='profile-detail'),  # Bestimmtes Profil anzeigen
    
    # Benutzer
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),  # Benutzerdetails anzeigen
    
    # Freundschaften
    path('friends/', views.FriendshipListCreateView.as_view(), name='friendship-list-create'),  # Freunde anzeigen/anfragen
    path('friends/list/', views.get_friends, name='get-friends'),  # Freunde-Liste abrufen
    path('friends/search/', views.search_users, name='search-users'),  # Benutzer suchen
    path('friends/<int:pk>/', views.FriendshipDestroyView.as_view(), name='friendship-destroy'),  # Freundschaft beenden
    path('friends/add/', views.add_friend, name='add-friend'),  # Freund hinzufügen
    path('friends/remove/', views.remove_friend, name='remove-friend'),  # Freund entfernen
    
    # Freundschafts-Anfragen
    path('friend-requests/', views.FriendshipRequestListCreateView.as_view(), name='friendship-request-list-create'),  # Freundschafts-Anfragen anzeigen/erstellen
    path('friend-requests/<int:pk>/', views.FriendshipRequestDetailView.as_view(), name='friendship-request-detail'),  # Freundschafts-Anfrage bearbeiten
    path('friend-requests/send/<int:user_id>/', views.send_friend_request, name='send-friend-request'),  # Freundschafts-Anfrage senden
    path('friend-requests/<int:request_id>/respond/', views.respond_to_friend_request, name='respond-to-friend-request'),  # Auf Anfrage antworten
    
    # Benachrichtigungen (entfernt)
    
    # Reports (Nutzer-Meldungen)
    path('reports/', views.UserReportCreateView.as_view(), name='user-report-create'),  # Nutzer melden
    path('reports/list/', views.UserReportListView.as_view(), name='user-report-list'),  # Alle Reports (Admin)
    
    # Router-URLs (für zukünftige ViewSets)
    path('', include(router.urls)),
]
