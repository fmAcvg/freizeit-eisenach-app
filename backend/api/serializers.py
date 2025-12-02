from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Event, EventParticipant, EventLike, EventComment, 
    Friendship, FriendshipRequest, UserRole, Profile, UserReport
)

# Serializer wandeln Django-Modelle in JSON um (für API-Übertragung)
# Sie definieren, welche Daten an das Frontend gesendet werden

class UserSerializer(serializers.ModelSerializer):
    # Serializer für Benutzerdaten - welche Infos werden übertragen?
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']  # Diese Felder werden gesendet
        read_only_fields = ['id', 'date_joined']  # Diese können nicht geändert werden

class ProfileSerializer(serializers.ModelSerializer):
    # Serializer für Benutzerprofile - inklusive Benutzerdaten
    user = UserSerializer(read_only=True)  # Benutzerdaten werden automatisch eingebettet
    age = serializers.ReadOnlyField()  # Berechnetes Alter (read-only)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'bio', 'avatar', 'location', 'status', 
            'birth_date', 'age_visible', 'age',  # Alters-Felder
            'profile_public', 'events_public', 'created_at', 'updated_at'
        ]  # Alle Profilfelder
        read_only_fields = ['id', 'age', 'created_at', 'updated_at']  # Automatische Felder

    def to_representation(self, instance):
        # Datenschutz: Geburtsdatum/Alter nur zeigen, wenn age_visible True ist
        data = super().to_representation(instance)
        try:
            if not instance.age_visible:
                data['birth_date'] = None
                data['age'] = None
        except Exception:
            pass
        return data

class EventParticipantSerializer(serializers.ModelSerializer):
    # Serializer für Veranstaltungsteilnehmer - zeigt wer teilnimmt
    user = UserSerializer(read_only=True)  # Benutzerdaten werden eingebettet
    
    class Meta:
        model = EventParticipant
        fields = ['id', 'user', 'joined_at']  # Teilnehmer-ID, Benutzer, Anmeldedatum
        read_only_fields = ['id', 'joined_at']  # Automatische Felder

class EventSerializer(serializers.ModelSerializer):
    # Hauptserializer für Veranstaltungen - zeigt alle wichtigen Infos
    created_by = UserSerializer(read_only=True)  # Wer hat es erstellt?
    participants = EventParticipantSerializer(many=True, read_only=True)  # Alle Teilnehmer
    participant_count = serializers.SerializerMethodField()  # Anzahl Teilnehmer (berechnet)
    likes_count = serializers.SerializerMethodField()  # Anzahl Likes (berechnet)
    comments_count = serializers.SerializerMethodField()  # Anzahl Kommentare (berechnet)
    image_url = serializers.SerializerMethodField()  # Bild-URL (berechnet aus image oder image_url)
    can_view_location = serializers.SerializerMethodField()  # Darf der Anfragende Ort/Kontakt sehen?
    friend_participants_count = serializers.SerializerMethodField()  # Anzahl Freund-Teilnehmer (nur bei Friends-Endpoint sinnvoll)
    is_participant = serializers.SerializerMethodField()  # Ist der aktuelle Nutzer Teilnehmer?
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location', 'date', 'image', 'image_url', 'cost',
            'contact_info', 'max_guests', 'min_age', 'status', 'created_by', 'created_at', 'updated_at',
            'published_at', 'participants', 'participant_count', 'likes_count', 'comments_count', 'can_view_location', 'friend_participants_count', 'is_participant'
        ]  # Alle Event-Felder
        read_only_fields = ['id', 'created_at', 'updated_at', 'participants', 'published_at', 'image_url']  # Automatische Felder
    
    def get_participant_count(self, obj):
        # Berechnet die Anzahl der Teilnehmer für eine Veranstaltung
        return obj.participants.count()
    
    def get_likes_count(self, obj):
        # Berechnet die Anzahl der Likes für eine Veranstaltung
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        # Berechnet die Anzahl der Kommentare für eine Veranstaltung
        return obj.comments.count()
    
    def get_image_url(self, obj):
        # Gibt die Bild-URL zurück - entweder hochgeladenes Bild oder externe URL
        image_url = obj.get_image_url()
        if image_url and not image_url.startswith('http'):
            # Relative URL zu absoluter URL konvertieren
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
        return image_url

    def get_can_view_location(self, obj):
        # Zeigt Ort/Kontakt nur dem Ersteller oder Teilnehmern
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.created_by_id == request.user.id:
            return True
        return EventParticipant.objects.filter(event=obj, user=request.user).exists()

    def to_representation(self, instance):
        # Ort/Kontakt ausblenden, wenn der Anfragende es nicht sehen darf
        data = super().to_representation(instance)
        try:
            if not data.get('can_view_location'):
                data['location'] = None
                data['contact_info'] = None
        except Exception:
            pass
        return data

    def get_friend_participants_count(self, obj):
        # Wenn vom QuerySet annotiert, diesen Wert nutzen; sonst 0
        return getattr(obj, 'friend_participants_count', 0)
    
    def get_is_participant(self, obj):
        # Prüft ob der aktuelle Nutzer Teilnehmer des Events ist
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return EventParticipant.objects.filter(event=obj, user=request.user).exists()
    
    def create(self, validated_data):
        # Beim Erstellen einer Veranstaltung wird automatisch der aktuelle Benutzer als Ersteller gesetzt
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class EventLikeSerializer(serializers.ModelSerializer):
    # Serializer für Event-Likes
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = EventLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        # Beim Erstellen eines Likes wird automatisch der aktuelle Benutzer gesetzt
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class EventCommentSerializer(serializers.ModelSerializer):
    # Serializer für Event-Kommentare mit Autor-Informationen
    author = UserSerializer(read_only=True)
    author_avatar = serializers.SerializerMethodField()  # Profilbild des Autors
    is_author = serializers.SerializerMethodField()  # Ist der aktuelle User der Autor?
    can_delete = serializers.SerializerMethodField()  # Kann der aktuelle User den Kommentar löschen?
    
    class Meta:
        model = EventComment
        fields = ['id', 'event', 'author', 'author_avatar', 'text', 'created_at', 'is_author', 'can_delete']
        # WICHTIG: 'event' read_only lassen, damit der Client es nicht mitsenden muss (wird in perform_create gesetzt)
        read_only_fields = ['id', 'event', 'created_at']
    
    def get_author_avatar(self, obj):
        # Hole das Profilbild des Kommentar-Autors
        try:
            if obj.author.profile.avatar:
                return obj.author.profile.avatar.url
        except:
            pass
        return None
    
    def get_is_author(self, obj):
        # Prüfe ob der aktuelle User der Autor ist
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user
        return False
    
    def get_can_delete(self, obj):
        # Prüfe ob der aktuelle User den Kommentar löschen kann
        # Autor oder Event-Ersteller können löschen
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author == request.user or obj.event.created_by == request.user
        return False
    
    def create(self, validated_data):
        # Beim Erstellen eines Kommentars wird automatisch der aktuelle Benutzer als Autor gesetzt
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class FriendshipSerializer(serializers.ModelSerializer):
    # Serializer für Freundschaften
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    
    class Meta:
        model = Friendship
        fields = ['id', 'user1', 'user2', 'created_at']
        read_only_fields = ['id', 'created_at']

class FriendshipRequestSerializer(serializers.ModelSerializer):
    # Serializer für Freundschafts-Anfragen
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    
    class Meta:
        model = FriendshipRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Beim Erstellen einer Anfrage wird automatisch der aktuelle Benutzer als Absender gesetzt
        validated_data['from_user'] = self.context['request'].user
        return super().create(validated_data)

class UserRoleSerializer(serializers.ModelSerializer):
    # Serializer für Benutzerrollen
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']

# Benachrichtigungen entfernt

class UserReportSerializer(serializers.ModelSerializer):
    # Serializer für Nutzer-Meldungen (User, Events und Kommentare)
    reporter = UserSerializer(read_only=True)
    reported_user = UserSerializer(read_only=True)
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_user_username = serializers.CharField(source='reported_user.username', read_only=True, allow_null=True)
    
    # Write-only Felder für das Erstellen von Reports
    reported_user_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    event_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    comment_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Read-only Felder für die Anzeige
    event_title = serializers.CharField(source='event.title', read_only=True, allow_null=True)
    comment_text = serializers.CharField(source='comment.text', read_only=True, allow_null=True)
    comment_author = serializers.CharField(source='comment.author.username', read_only=True, allow_null=True)
    
    class Meta:
        model = UserReport
        fields = [
            'id', 'reporter', 'reported_user', 'reporter_username', 'reported_user_username', 
            'reported_user_id', 'event_id', 'event_title', 'comment_id', 'comment_text', 'comment_author',
            'reason', 'description', 'status', 'admin_notes', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'reporter', 'created_at', 'updated_at', 'resolved_at']
    
    def create(self, validated_data):
        # Setze den Reporter automatisch auf den aktuellen Benutzer
        validated_data['reporter'] = self.context['request'].user
        
        # Konvertiere reported_user_id zu User-Objekt
        reported_user_id = validated_data.pop('reported_user_id', None)
        if reported_user_id:
            from django.contrib.auth.models import User
            validated_data['reported_user'] = User.objects.get(id=reported_user_id)
        
        # Konvertiere event_id zu Event-Objekt
        event_id = validated_data.pop('event_id', None)
        if event_id:
            validated_data['event'] = Event.objects.get(id=event_id)
        
        # Konvertiere comment_id zu EventComment-Objekt
        comment_id = validated_data.pop('comment_id', None)
        if comment_id:
            validated_data['comment'] = EventComment.objects.get(id=comment_id)
        
        return super().create(validated_data)
