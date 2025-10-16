from rest_framework import generics, permissions, status, parsers
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q, Count, F
from rest_framework.exceptions import ValidationError
from django.db.utils import IntegrityError
from .models import ReportReason
from .models import Event, EventParticipant, EventLike, EventComment, Profile, Friendship, FriendshipRequest, UserReport
from .serializers import (
    EventSerializer, EventParticipantSerializer, EventLikeSerializer, 
    EventCommentSerializer, ProfileSerializer, UserSerializer, 
    FriendshipSerializer, FriendshipRequestSerializer, UserReportSerializer
)

# Hier definiere ich alle API-Views - das sind die Funktionen, die auf HTTP-Anfragen reagieren
# Views bestimmen, was passiert, wenn jemand eine URL aufruft (z.B. GET /api/events/)

# Veranstaltungs-Views
class EventListCreateView(generics.ListCreateAPIView):
    # Diese View zeigt alle Veranstaltungen an und erlaubt das Erstellen neuer Veranstaltungen
    serializer_class = EventSerializer  # Welcher Serializer soll verwendet werden?
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Lesen erlaubt für alle, Schreiben nur für angemeldete Benutzer
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]  # Unterstützt Datei-Uploads
    
    def get_queryset(self):
        # Basis: veröffentlichte Events
        queryset = Event.objects.filter(status='published')

        # Altersfilter, wenn Alter bekannt
        if self.request.user.is_authenticated:
            try:
                profile = self.request.user.profile
                if profile.age is not None:
                    queryset = queryset.filter(Q(min_age__isnull=True) | Q(min_age__lte=profile.age))
            except Profile.DoesNotExist:
                pass

        # Kapazitätsfilter: volle Events ausblenden, außer für Ersteller/Teilnehmer
        queryset = queryset.annotate(participant_count=Count('participants'))
        user = self.request.user if self.request.user.is_authenticated else None
        if user:
            # Behalte Events, die nicht voll sind ODER bei denen der Nutzer Ersteller/Teilnehmer ist
            queryset = queryset.filter(
                Q(max_guests__isnull=True) | Q(participant_count__lt=F('max_guests')) |
                Q(created_by=user) | Q(participants__user=user)
            )
        else:
            # nicht eingeloggt: nur nicht volle Events
            queryset = queryset.filter(Q(max_guests__isnull=True) | Q(participant_count__lt=F('max_guests')))

        return queryset.order_by('-date').distinct()
    
    def perform_create(self, serializer):
        # Beim Erstellen einer Veranstaltung wird automatisch der aktuelle Benutzer als Ersteller gesetzt
        # Neue Events haben standardmäßig den Status "pending" (wartet auf Freigabe)
        serializer.save(created_by=self.request.user, status='pending')

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    # Diese View zeigt eine bestimmte Veranstaltung an und erlaubt das Bearbeiten/Löschen
    queryset = Event.objects.all()  # Alle Veranstaltungen
    serializer_class = EventSerializer  # Gleicher Serializer wie oben
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Gleiche Berechtigungen

    def get_object(self):
        event = super().get_object()
        # Altersgating: Angemeldete Nutzer sehen Events oberhalb ihres Alters nicht,
        # außer sie sind Ersteller oder bereits Teilnehmer
        user = self.request.user
        if user.is_authenticated and event.min_age is not None:
            try:
                profile = user.profile
                user_age = profile.age
            except Profile.DoesNotExist:
                user_age = None

            if (
                (user_age is None or user_age < event.min_age)
                and event.created_by_id != user.id
                and not EventParticipant.objects.filter(event=event, user=user).exists()
            ):
                # Aus Sicherheitsgründen 404 statt 403 zurückgeben
                from rest_framework.exceptions import NotFound
                raise NotFound(detail='Event nicht gefunden')
        return event

class FriendEventsListView(generics.ListAPIView):
    # Liste von Events, an denen mindestens ein Freund teilnimmt
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Freunde des aktuellen Nutzers ermitteln (symmetrisch)
        user = self.request.user
        friend_ids = set()
        friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user)).only('user1_id', 'user2_id')
        for fs in friendships:
            friend_ids.add(fs.user2_id if fs.user1_id == user.id else fs.user1_id)
        
        # Events mit mindestens einem Freund als Teilnehmer
        qs = Event.objects.filter(status='published', participants__user_id__in=friend_ids).distinct()
        # Zähle, wie viele Freunde teilnehmen (für Anzeige)
        qs = qs.annotate(friend_participants_count=Count('participants', filter=Q(participants__user_id__in=friend_ids)))
        return qs.order_by('-date')

# Meine Events Views
class MyCreatedEventsView(generics.ListAPIView):
    # Diese View zeigt alle Events an, die der aktuelle User erstellt hat
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Zeige nur Events, die der aktuelle User erstellt hat
        user = self.request.user
        events = Event.objects.filter(created_by=user)
        
        # Debug-Ausgabe
        print(f"DEBUG MyCreatedEventsView - User: {user.username} (ID: {user.id})")
        print(f"DEBUG Alle Events in DB: {Event.objects.count()}")
        print(f"DEBUG Events von diesem User: {events.count()}")
        
        for event in events:
            print(f"   - {event.title} (ID: {event.id}, Status: {event.status})")
        
        return events

class MyParticipatedEventsView(generics.ListAPIView):
    # Diese View zeigt alle Events an, an denen der aktuelle User teilnimmt
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Zeige nur Events, an denen der aktuelle User teilnimmt
        user = self.request.user
        
        # Debug-Ausgabe
        print(f"DEBUG MyParticipatedEventsView - User: {user.username} (ID: {user.id})")
        
        # Direkte Abfrage der EventParticipant-Objekte für Debug
        participant_objects = EventParticipant.objects.filter(user=user)
        print(f"DEBUG EventParticipant-Objekte für {user.username}: {participant_objects.count()}")
        
        for participant in participant_objects:
            print(f"   - Event: {participant.event.title} (ID: {participant.event.id})")
        
        # Events über die QuerySet-Methode
        participated_events = Event.objects.filter(participants__user=user).distinct()
        print(f"DEBUG Events via QuerySet: {participated_events.count()}")
        
        for event in participated_events:
            print(f"   - {event.title} (ID: {event.id}, Status: {event.status})")
        
        return participated_events

# Event-Like Views
class EventLikeCreateView(generics.CreateAPIView):
    # Diese View erlaubt das Liken eines Events
    serializer_class = EventLikeSerializer  # Serializer für Likes
    permission_classes = [permissions.IsAuthenticated]  # Nur angemeldete Benutzer
    
    def perform_create(self, serializer):
        # Beim Erstellen eines Likes wird automatisch der aktuelle Benutzer und das Event gesetzt
        event_id = self.kwargs['event_id']
        event = Event.objects.get(id=event_id)
        serializer.save(user=self.request.user, event=event)

class EventLikeToggleView(APIView):
    """Toggle-Like: Wenn bereits geliked, dann entfernen, sonst hinzufügen"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

        existing = EventLike.objects.filter(event_id=event_id, user=request.user).first()
        if existing:
            existing.delete()
            liked = False
        else:
            # Erstellen, UNIQUE-Constraint ist durch Vorprüfung abgesichert
            EventLike.objects.create(event=event, user=request.user)
            liked = True

        likes_count = EventLike.objects.filter(event_id=event_id).count()
        return Response({'status': 'liked' if liked else 'unliked', 'likes_count': likes_count})

# Event-Kommentar Views
class EventCommentListCreateView(generics.ListCreateAPIView):
    # Diese View zeigt alle Kommentare zu einem Event an und erlaubt das Erstellen neuer Kommentare
    serializer_class = EventCommentSerializer  # Serializer für Kommentare
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Lesen für alle, Schreiben nur für angemeldete Benutzer
    
    def get_queryset(self):
        # Filtere nur die Kommentare der spezifischen Veranstaltung
        event_id = self.kwargs['event_id']
        return EventComment.objects.filter(event_id=event_id).select_related('author', 'author__profile')
    
    def perform_create(self, serializer):
        # Beim Erstellen eines Kommentars wird automatisch der aktuelle Benutzer und das Event gesetzt
        event_id = self.kwargs['event_id']
        event = Event.objects.get(id=event_id)
        serializer.save(author=self.request.user, event=event)

class EventCommentDestroyView(generics.DestroyAPIView):
    # Diese View erlaubt das Löschen eines Kommentars (nur vom Autor oder Event-Ersteller)
    serializer_class = EventCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Benutzer kann nur seine eigenen Kommentare löschen oder Kommentare auf seinen eigenen Events
        return EventComment.objects.filter(
            Q(author=self.request.user) | Q(event__created_by=self.request.user)
        )
    
    def perform_destroy(self, instance):
        # Prüfe ob der Benutzer berechtigt ist, diesen Kommentar zu löschen
        if instance.author == self.request.user:
            # Autor kann seinen eigenen Kommentar löschen
            instance.delete()
        elif instance.event.created_by == self.request.user:
            # Event-Ersteller kann Kommentare auf seinem Event löschen
            instance.delete()
        else:
            # Nicht berechtigt
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Du hast keine Berechtigung, diesen Kommentar zu löschen.")

# Freundschafts-Views
class FriendshipListCreateView(generics.ListCreateAPIView):
    # Diese View zeigt alle Freunde des Benutzers an und erlaubt das Erstellen neuer Freundschaftsanfragen
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Zeige alle Freundschaften des aktuellen Benutzers
        return Friendship.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        )
    
    def perform_create(self, serializer):
        # Beim Erstellen einer Freundschaftsanfrage wird automatisch der aktuelle Benutzer als user1 gesetzt
        user2_id = self.request.data.get('user2')
        if user2_id:
            user2 = User.objects.get(id=user2_id)
            serializer.save(user1=self.request.user, user2=user2)

class FriendshipDestroyView(generics.DestroyAPIView):
    # Diese View erlaubt das Löschen von Freundschaften
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Nur Freundschaften des aktuellen Benutzers können gelöscht werden
        return Friendship.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        )

# Benachrichtigungs-Views
# Benachrichtigungen entfernt

# Teilnehmer-Views
class EventParticipantListCreateView(generics.ListCreateAPIView):
    # Diese View zeigt alle Teilnehmer einer Veranstaltung an und erlaubt das Beitreten
    serializer_class = EventParticipantSerializer  # Serializer für Teilnehmerdaten
    permission_classes = [permissions.IsAuthenticated]  # Nur angemeldete Benutzer
    
    def get_queryset(self):
        # Filtere nur die Teilnehmer der spezifischen Veranstaltung
        event_id = self.kwargs['event_id']
        base_qs = EventParticipant.objects.filter(event_id=event_id)
        # Datenschutz: Teilnehmer verstecken, wenn ihr Profil nicht öffentlich ist,
        # außer der Anfragende ist der Teilnehmer selbst oder der Event-Ersteller
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return base_qs.none()
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            # Nicht eingeloggte sehen nur Teilnehmer mit öffentlichen Events-Einstellungen
            return base_qs.filter(user__profile__events_public=True)
        if event.created_by_id == user.id:
            return base_qs
        return base_qs.filter(
            Q(user=user) | Q(user__profile__events_public=True)
        )
    
    def create(self, request, *args, **kwargs):
        # Idempotentes Beitreten mit Kapazitätsprüfung
        event_id = self.kwargs['event_id']
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

        # Bereits Teilnehmer?
        existing = EventParticipant.objects.filter(event=event, user=request.user).first()
        if existing:
            data = EventParticipantSerializer(existing).data
            return Response(data, status=status.HTTP_200_OK)

        # Alters-Check
        if event.min_age is not None:
            try:
                profile = request.user.profile
                user_age = profile.age
            except Profile.DoesNotExist:
                user_age = None
            if user_age is None or user_age < event.min_age:
                return Response({'error': f'Teilnahme ab {event.min_age} Jahren.'}, status=status.HTTP_400_BAD_REQUEST)

        # Kapazität prüfen
        if event.max_guests is not None:
            current = EventParticipant.objects.filter(event=event).count()
            if current >= event.max_guests:
                return Response({'error': 'Dieses Event ist bereits voll.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, event=event)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class EventParticipantDestroyView(generics.DestroyAPIView):
    # Diese View erlaubt das Verlassen einer Veranstaltung (Löschen der Teilnahme)
    serializer_class = EventParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]  # Nur angemeldete Benutzer
    
    def get_queryset(self):
        # Ein Benutzer kann nur seine eigene Teilnahme löschen
        event_id = self.kwargs['event_id']
        return EventParticipant.objects.filter(event_id=event_id, user=self.request.user)

# Profil-Views
class ProfileDetailUpdateView(generics.RetrieveUpdateAPIView):
    # Diese View zeigt das eigene Profil an und erlaubt das Bearbeiten
    serializer_class = ProfileSerializer  # Serializer für Profildaten
    permission_classes = [permissions.IsAuthenticated]  # Nur angemeldete Benutzer
    
    def get_object(self):
        # Holt das Profil des aktuellen Benutzers, erstellt es falls es nicht existiert
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

# Benutzer-Views
class UserDetailView(generics.RetrieveAPIView):
    # Diese View zeigt Details eines bestimmten Benutzers an
    queryset = User.objects.all()  # Alle Benutzer
    serializer_class = UserSerializer  # Serializer für Benutzerdaten
    permission_classes = [permissions.IsAuthenticated]  # Nur angemeldete Benutzer

# Alters-Analytics View
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def event_age_analytics(request, event_id):
    """
    Zeigt Altersverteilung der Teilnehmer eines Events an
    Nur der Event-Ersteller kann diese Daten einsehen
    """
    try:
        event = Event.objects.get(id=event_id, created_by=request.user)
        participants = EventParticipant.objects.filter(event=event)
        
        # Altersverteilung berechnen
        age_groups = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56-65': 0,
            '65+': 0,
            'unbekannt': 0
        }
        
        for participant in participants:
            try:
                profile = participant.user.profile
                if profile.age is not None:
                    age = profile.age
                    if 18 <= age <= 25:
                        age_groups['18-25'] += 1
                    elif 26 <= age <= 35:
                        age_groups['26-35'] += 1
                    elif 36 <= age <= 45:
                        age_groups['36-45'] += 1
                    elif 46 <= age <= 55:
                        age_groups['46-55'] += 1
                    elif 56 <= age <= 65:
                        age_groups['56-65'] += 1
                    else:
                        age_groups['65+'] += 1
                else:
                    age_groups['unbekannt'] += 1
            except Profile.DoesNotExist:
                age_groups['unbekannt'] += 1
        
        return Response({
            'event_id': event_id,
            'event_title': event.title,
            'total_participants': participants.count(),
            'age_distribution': age_groups
        })
        
    except Event.DoesNotExist:
        return Response(
            {'error': 'Event nicht gefunden oder keine Berechtigung'}, 
            status=status.HTTP_404_NOT_FOUND
        )

# Profil-Detail-View
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_detail(request, user_id):
    """
    Zeigt ein bestimmtes Benutzerprofil an mit Freundschaftsstatus und veröffentlichten Events
    """
    try:
        # Zielbenutzer finden
        target_user = User.objects.get(id=user_id)
        target_profile = Profile.objects.get_or_create(user=target_user)[0]
        
        # Freundschaftsstatus prüfen
        is_friend = False
        friendship_status = 'none'
        
        if request.user.id != user_id:  # Nur bei anderen Benutzern
            friendship = Friendship.objects.filter(
                Q(user1=request.user, user2=target_user) |
                Q(user1=target_user, user2=request.user)
            ).first()
            
            if friendship:
                is_friend = True
                friendship_status = 'accepted'
        
        # Veröffentlichte Events des Benutzers
        published_events = Event.objects.filter(
            created_by=target_user,
            status='published'
        ).order_by('-created_at')[:10]  # Nur die 10 neuesten
        
        # Events serialisieren
        events_data = []
        for event in published_events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'location': event.location,
                'date': event.date.isoformat(),
                'status': event.status,
                'created_at': event.created_at.isoformat(),
            })
        
        # Datenschutz: Minimale Daten für nicht-öffentliche Profile bei Fremden
        is_self = request.user.id == target_user.id
        is_public = bool(getattr(target_profile, 'profile_public', True))
        if not is_self and not is_public and not is_friend:
            profile_data = {
                'id': str(target_user.id),
                'username': target_user.username,
                'is_friend': is_friend,
                'friendship_status': friendship_status,
            }
            return Response(profile_data)

        # Profil-Daten zusammenstellen (ohne sensible Felder für Fremde)
        profile_data = {
            'id': str(target_user.id),
            'username': target_user.username,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'email': target_user.email if is_self else None,
            'bio': target_profile.bio,
            'avatar': target_profile.avatar.url if target_profile.avatar else None,
            'birth_date': target_profile.birth_date.isoformat() if (target_profile.birth_date and target_profile.age_visible) else None,
            'age_visible': target_profile.age_visible,
            'created_events': Event.objects.filter(created_by=target_user).count(),
            'published_events': events_data,
            'is_friend': is_friend,
            'friendship_status': friendship_status,
        }
        
        return Response(profile_data)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Benutzer nicht gefunden'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Freunde-API-Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_friends(request):
    """
    Gibt alle Freunde des aktuellen Benutzers zurück
    """
    try:
        # Alle Freundschaften des aktuellen Benutzers finden
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2')
        
        friends = []
        for friendship in friendships:
            # Den anderen Benutzer in der Freundschaft finden
            if friendship.user1 == request.user:
                friend_user = friendship.user2
            else:
                friend_user = friendship.user1
            
            # Profil des Freundes abrufen
            try:
                friend_profile = Profile.objects.get(user=friend_user)
                friends.append({
                    'id': friend_user.id,
                    'username': friend_user.username,
                    'first_name': friend_user.first_name,
                    'last_name': friend_user.last_name,
                    'bio': friend_profile.bio or '',
                    'avatar': friend_profile.avatar.url if friend_profile.avatar else None,
                    'created_events': Event.objects.filter(created_by=friend_user).count(),
                    'friendship_date': friendship.created_at.isoformat(),
                })
            except Profile.DoesNotExist:
                continue
        
        return Response(friends)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """
    Sucht nach Benutzern basierend auf einem Suchbegriff
    """
    try:
        query = request.GET.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        
        # Benutzer suchen (Username, Vor- oder Nachname)
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).exclude(id=request.user.id)  # Aktuellen Benutzer ausschließen
        
        # Freunde des aktuellen Benutzers finden
        friend_ids = set()
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        )
        for friendship in friendships:
            if friendship.user1 == request.user:
                friend_ids.add(friendship.user2.id)
            else:
                friend_ids.add(friendship.user1.id)
        
        search_results = []
        for user in users[:20]:  # Maximal 20 Ergebnisse
            try:
                profile = Profile.objects.get(user=user)
                is_friend = user.id in friend_ids
                # Nur öffentliche Profile zeigen, außer eigener Account oder Freund
                if not profile.profile_public and (user.id != request.user.id) and not is_friend:
                    continue
                
                search_results.append({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'bio': profile.bio or '',
                    'avatar': profile.avatar.url if profile.avatar else None,
                    'created_events': Event.objects.filter(created_by=user).count(),
                    'is_friend': is_friend,
                })
            except Profile.DoesNotExist:
                continue
        
        return Response(search_results)
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Freundschafts-API-Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_friend(request):
    """
    Fügt einen Freund hinzu oder sendet eine Freundschaftsanfrage
    """
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id ist erforderlich'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_user = User.objects.get(id=user_id)
        
        # Prüfen, ob bereits eine Freundschaft existiert
        existing_friendship = Friendship.objects.filter(
            Q(user1=request.user, user2=target_user) |
            Q(user1=target_user, user2=request.user)
        ).first()
        
        if existing_friendship:
            return Response(
                {'error': 'Benutzer ist bereits ein Freund'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Neue Freundschaft erstellen
        friendship = Friendship.objects.create(
            user1=request.user,
            user2=target_user
        )
        
        return Response({'message': 'Freundschaftsanfrage gesendet'})
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Benutzer nicht gefunden'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_friend(request):
    """
    Entfernt eine Freundschaft
    """
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id ist erforderlich'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_user = User.objects.get(id=user_id)
        
        # Freundschaft finden und löschen
        friendship = Friendship.objects.filter(
            Q(user1=request.user, user2=target_user) |
            Q(user1=target_user, user2=request.user)
        ).first()
        
        if friendship:
            friendship.delete()
            return Response({'message': 'Freundschaft entfernt'})
        else:
            return Response(
                {'error': 'Keine Freundschaft gefunden'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Benutzer nicht gefunden'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# API-Übersichts-View
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_root(request):
    """
    API-Übersichtsseite - zeigt alle verfügbaren Endpunkte an.
    Diese Funktion wird aufgerufen, wenn jemand /api/ aufruft.
    """
    return Response({
        'events': '/api/events/',  # Alle Veranstaltungen
        'users': '/api/users/',  # Benutzerdaten
        'profiles': '/api/profiles/',  # Benutzerprofile
        'friend-requests': '/api/friend-requests/',  # Freundschafts-Anfragen
        'friends': '/api/friends/',  # Freunde
        'admin': '/admin/',  # Admin-Interface
    })

# Leichter Health-Check Endpunkt für Konnektivitätstests
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health(request):
    # Gibt einfachen Status zurück, damit Frontend/Startskript die Verbindung prüfen kann
    return Response({'status': 'ok'})

# Report-Views
class UserReportCreateView(generics.CreateAPIView):
    # View zum Erstellen von Nutzer-Meldungen
    serializer_class = UserReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Eingaben lesen
        reported_user_id = request.data.get('reported_user_id')
        comment_id = request.data.get('comment_id')
        event_id = request.data.get('event_id')

        # 1) Nutzer-Report: Selbstmeldung verhindern und Duplikate prüfen
        if reported_user_id:
            if str(request.user.id) == str(reported_user_id):
                return Response({'error': 'Du kannst dich nicht selbst melden.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                reported_user = User.objects.get(id=reported_user_id)
            except User.DoesNotExist:
                return Response({'error': 'Der gemeldete Nutzer existiert nicht.'}, status=status.HTTP_400_BAD_REQUEST)
            if UserReport.objects.filter(reporter=request.user, reported_user=reported_user).exists():
                return Response({'error': 'Du hast diesen Nutzer bereits gemeldet.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Kommentar-Report: optionale Duplikatsprüfung
        if comment_id:
            if UserReport.objects.filter(reporter=request.user, comment_id=comment_id).exists():
                return Response({'error': 'Diesen Kommentar hast du bereits gemeldet.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Event-Report: optionale Duplikatsprüfung
        if event_id:
            if UserReport.objects.filter(reporter=request.user, event_id=event_id).exists():
                return Response({'error': 'Dieses Event hast du bereits gemeldet.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            # Fange unique_together Constraint-Fehler ab
            if 'UNIQUE constraint failed' in str(e) or 'duplicate key value' in str(e):
                return Response(
                    {'error': 'Du hast diesen Nutzer bereits gemeldet.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Andere Integrity-Fehler weiterwerfen
            raise e

class UserReportListView(generics.ListAPIView):
    # View zum Anzeigen aller Meldungen (nur für Admins)
    serializer_class = UserReportSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return UserReport.objects.all()

# Kommentar direkt melden (robuster Endpunkt)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def report_comment(request, comment_id):
    try:
        comment = EventComment.objects.get(id=comment_id)
    except EventComment.DoesNotExist:
        return Response({'error': 'Kommentar nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason')
    description = request.data.get('description', '')

    # Grund validieren
    valid_reasons = [choice[0] for choice in ReportReason.choices]
    if reason not in valid_reasons:
        return Response({'error': 'Ungültiger Meldegrund', 'valid_reasons': valid_reasons}, status=status.HTTP_400_BAD_REQUEST)

    # Duplikate vermeiden
    if UserReport.objects.filter(reporter=request.user, comment=comment).exists():
        return Response({'error': 'Diesen Kommentar hast du bereits gemeldet.'}, status=status.HTTP_400_BAD_REQUEST)

    report = UserReport.objects.create(
        reporter=request.user,
        comment=comment,
        reason=reason,
        description=description,
        status='pending'
    )
    return Response({'status': 'created', 'report_id': report.id}, status=status.HTTP_201_CREATED)

# Freundschafts-Anfragen Views
class FriendshipRequestListCreateView(generics.ListCreateAPIView):
    # View zum Anzeigen und Erstellen von Freundschafts-Anfragen
    serializer_class = FriendshipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Zeige nur Anfragen, die der Benutzer gesendet oder erhalten hat
        user = self.request.user
        return FriendshipRequest.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        ).order_by('-created_at')

class FriendshipRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    # View zum Anzeigen, Aktualisieren und Löschen einzelner Freundschafts-Anfragen
    serializer_class = FriendshipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Benutzer kann nur seine eigenen Anfragen bearbeiten
        user = self.request.user
        return FriendshipRequest.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_friend_request(request, user_id):
    """Freundschafts-Anfrage an einen Benutzer senden"""
    print(f"DEBUG: send_friend_request called with user_id={user_id}")
    print(f"DEBUG: request.user={request.user}")
    print(f"DEBUG: request.data={request.data}")
    
    try:
        to_user = User.objects.get(id=user_id)
        print(f"DEBUG: to_user found: {to_user}")
    except User.DoesNotExist:
        print("DEBUG: User not found")
        return Response({'error': 'Benutzer nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    if to_user == request.user:
        return Response({'error': 'Du kannst dir keine Freundschafts-Anfrage senden'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Prüfe ob bereits eine Freundschaft oder Anfrage existiert
    existing_friendship = Friendship.objects.filter(
        Q(user1=request.user, user2=to_user) | 
        Q(user1=to_user, user2=request.user)
    ).exists()
    
    if existing_friendship:
        return Response({'error': 'Ihr seid bereits befreundet'}, status=status.HTTP_400_BAD_REQUEST)
    
    existing_request = FriendshipRequest.objects.filter(
        from_user=request.user, 
        to_user=to_user,
        status='pending'
    ).exists()
    
    if existing_request:
        return Response({'error': 'Eine Freundschafts-Anfrage ist bereits ausstehend'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Erstelle die Freundschafts-Anfrage
    message = request.data.get('message', '')
    friend_request = FriendshipRequest.objects.create(
        from_user=request.user,
        to_user=to_user,
        message=message
    )
    
    serializer = FriendshipRequestSerializer(friend_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_friend_request(request, request_id):
    """Auf Freundschafts-Anfrage antworten (annehmen oder ablehnen)"""
    try:
        friend_request = FriendshipRequest.objects.get(
            id=request_id, 
            to_user=request.user,
            status='pending'
        )
    except FriendshipRequest.DoesNotExist:
        return Response({'error': 'Freundschafts-Anfrage nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action')  # 'accept' oder 'decline'
    
    if action == 'accept':
        # Freundschaft erstellen
        Friendship.objects.get_or_create(
            user1=friend_request.from_user,
            user2=friend_request.to_user
        )
        friend_request.status = 'accepted'
        friend_request.save()
        
        return Response({'message': 'Freundschafts-Anfrage angenommen'}, status=status.HTTP_200_OK)
    
    elif action == 'decline':
        friend_request.status = 'declined'
        friend_request.save()
        
        return Response({'message': 'Freundschafts-Anfrage abgelehnt'}, status=status.HTTP_200_OK)
    
    else:
        return Response({'error': 'Ungültige Aktion'}, status=status.HTTP_400_BAD_REQUEST)
