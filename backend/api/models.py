from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# hier liegen alle datenbank-modelle für unsere app

# Enums für verschiedene Status-Werte
class EventStatus(models.TextChoices):
    DRAFT = 'draft', 'Entwurf'
    PENDING = 'pending', 'Wartet auf Freigabe'
    PUBLISHED = 'published', 'Veröffentlicht'
    CANCELLED = 'cancelled', 'Abgesagt'

class UserStatus(models.TextChoices):
    ONLINE = 'online', 'Online'
    OFFLINE = 'offline', 'Offline'

class NotificationType(models.TextChoices):
    EVENT_INVITE = 'event_invite', 'Event-Einladung'
    FRIEND_REQUEST = 'friend_request', 'Freundschaftsanfrage'
    COMMENT = 'comment', 'Kommentar'
    LIKE = 'like', 'Like'

class FriendshipRequestStatus(models.TextChoices):
    PENDING = 'pending', 'Ausstehend'
    ACCEPTED = 'accepted', 'Angenommen'
    DECLINED = 'declined', 'Abgelehnt'
    CANCELLED = 'cancelled', 'Storniert'

class ReportStatus(models.TextChoices):
    PENDING = 'pending', 'Ausstehend'
    REVIEWED = 'reviewed', 'Überprüft'
    RESOLVED = 'resolved', 'Gelöst'
    DISMISSED = 'dismissed', 'Abgewiesen'

class ReportReason(models.TextChoices):
    INAPPROPRIATE_CONTENT = 'inappropriate_content', 'Unangemessener Inhalt'
    HARASSMENT = 'harassment', 'Belästigung'
    SPAM = 'spam', 'Spam'
    FAKE_PROFILE = 'fake_profile', 'Falsches Profil'
    VIOLENCE = 'violence', 'Gewalt'
    OTHER = 'other', 'Sonstiges'

class Event(models.Model):
    # ein event mit titel, beschreibung, zeit und ort
    title = models.CharField(max_length=200)  # name der veranstaltung
    description = models.TextField()  # kurze oder lange beschreibung
    date = models.DateTimeField()  # wann findet es statt
    location = models.CharField(max_length=200)  # wo findet es statt
    image_url = models.URLField(blank=True, null=True)  # externe bild url (optional)
    image = models.ImageField(upload_to='event_images/', blank=True, null=True)  # hochgeladenes bild
    cost = models.CharField(max_length=50, blank=True)  # z.b. „kostenlos“ oder „5€“
    contact_info = models.TextField(blank=True)  # kontakt (optional)
    max_guests = models.PositiveIntegerField(blank=True, null=True)  # maximale teilnehmerzahl
    min_age = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])  # mindestalter
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.DRAFT)  # status
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')  # ersteller
    created_at = models.DateTimeField(auto_now_add=True)  # wann erstellt
    updated_at = models.DateTimeField(auto_now=True)  # letzte änderung
    published_at = models.DateTimeField(blank=True, null=True)  # wann veröffentlicht (optional)
    
    class Meta:
        ordering = ['-date']  # neueste zuerst anzeigen
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['status']),
            models.Index(fields=['date']),
            models.Index(fields=['status', 'date']),
        ]
    
    def get_image_url(self):
        """liefert die bild url, egal ob upload oder externe url"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None

    def __str__(self):
        return self.title  # im admin sieht man dann direkt den titel

class EventParticipant(models.Model):
    # teilnahme eines users an einem event
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')  # zu welchem event
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_participations')  # welcher user
    joined_at = models.DateTimeField(auto_now_add=True)  # seit wann dabei
    
    class Meta:
        unique_together = ['event', 'user']  # user kann nur einmal teilnehmen
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"  # im admin gut lesbar

class EventLike(models.Model):
    # like für ein event von einem user
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='likes')  # welches event
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_likes')  # welcher user
    created_at = models.DateTimeField(auto_now_add=True)  # wann geliked
    
    class Meta:
        unique_together = ['event', 'user']  # nur ein like pro user/event
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} liked {self.event.title}"

class EventComment(models.Model):
    # kommentar zu einem event
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')  # zu welchem event
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_comments')  # wer hat geschrieben
    text = models.TextField()  # was steht drin
    created_at = models.DateTimeField(auto_now_add=True)  # wann geschrieben
    
    class Meta:
        ordering = ['-created_at']  # neueste zuerst
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['author']),
            models.Index(fields=['event', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.author.username} kommentierte {self.event.title}"

class Friendship(models.Model):
    # freundschaft zwischen zwei usern
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_as_user1')  # erster user
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_as_user2')  # zweiter user
    created_at = models.DateTimeField(auto_now_add=True)  # seit wann befreundet
    
    class Meta:
        unique_together = ['user1', 'user2']  # freundschaft nur einmal
        indexes = [
            models.Index(fields=['user1']),
            models.Index(fields=['user2']),
        ]
    
    def __str__(self):
        return f"{self.user1.username} - {self.user2.username}"

class FriendshipRequest(models.Model):
    # freundschaftsanfrage von a nach b
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests')  # wer fragt
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests')  # wen fragt er
    status = models.CharField(max_length=20, choices=FriendshipRequestStatus.choices, default=FriendshipRequestStatus.PENDING)  # status der anfrage
    created_at = models.DateTimeField(auto_now_add=True)  # wann gesendet
    updated_at = models.DateTimeField(auto_now=True)  # wann zuletzt geändert
    message = models.TextField(blank=True, null=True)  # nachricht (optional)
    
    class Meta:
        unique_together = ['from_user', 'to_user']  # anfrage nur einmal pro paar
        indexes = [
            models.Index(fields=['from_user']),
            models.Index(fields=['to_user']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username} ({self.status})"

class UserRole(models.Model):
    # einfache rollen für user (admin/user)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')  # welcher user
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'Benutzer')])  # welche rolle
    created_at = models.DateTimeField(auto_now_add=True)  # seit wann
    
    class Meta:
        unique_together = ['user', 'role']  # Ein Benutzer kann eine Rolle nur einmal haben
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Notification(models.Model):
    # benachrichtigung für user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')  # empfänger
    type = models.CharField(max_length=20, choices=NotificationType.choices)  # art
    title = models.CharField(max_length=200)  # titel
    message = models.TextField()  # nachrichtentext
    is_read = models.BooleanField(default=False)  # schon gelesen
    data = models.JSONField(blank=True, null=True)  # extra daten (optional)
    created_at = models.DateTimeField(auto_now_add=True)  # wann erstellt
    
    class Meta:
        ordering = ['-created_at']  # neueste oben
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username}: {self.title}"

class Profile(models.Model):
    # benutzerprofil mit optionalen details
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')  # verknüpft mit user
    bio = models.TextField(blank=True)  # kurze beschreibung (optional)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  # profilbild (optional)
    location = models.CharField(max_length=100, blank=True)  # wohnort
    status = models.CharField(max_length=20, choices=UserStatus.choices, default=UserStatus.OFFLINE)  # online-status
    
    # alter/geburtstag
    birth_date = models.DateField(blank=True, null=True)  # geburtsdatum
    age_visible = models.BooleanField(default=True)  # alter anzeigen
    
    # datenschutz
    profile_public = models.BooleanField(default=True)  # profil öffentlich
    events_public = models.BooleanField(default=True)   # event-teilnahme öffentlich
    
    created_at = models.DateTimeField(auto_now_add=True)  # erstellt am
    updated_at = models.DateTimeField(auto_now=True)  # geändert am
    
    @property
    def age(self):
        """berechnet das aktuelle alter aus dem geburtsdatum"""
        if not self.birth_date:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
    
    def __str__(self):
        return f"{self.user.username}'s Profile"  # im admin: „benutzername's profil“

class UserReport(models.Model):
    # meldung (report) gegen user/event/kommentar
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')  # wer meldet
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received', blank=True, null=True)  # wer wird gemeldet
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reports', blank=True, null=True)  # gemeldetes event
    comment = models.ForeignKey('EventComment', on_delete=models.CASCADE, related_name='reports', blank=True, null=True)  # gemeldeter kommentar
    reason = models.CharField(max_length=30, choices=ReportReason.choices)  # grund
    description = models.TextField(blank=True)  # beschreibung (optional)
    status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.PENDING)  # status
    admin_notes = models.TextField(blank=True)  # notizen (optional)
    created_at = models.DateTimeField(auto_now_add=True)  # erstellt am
    updated_at = models.DateTimeField(auto_now=True)  # geändert am
    resolved_at = models.DateTimeField(blank=True, null=True)  # gelöst am (optional)
    
    class Meta:
        ordering = ['-created_at']  # neueste zuerst
        indexes = [
            models.Index(fields=['reporter']),
            models.Index(fields=['reported_user']),
            models.Index(fields=['status']),
            models.Index(fields=['reason']),
            models.Index(fields=['status', 'created_at']),
        ]
        # unique_together entfernt, weil jetzt mehrere modelle gemeldet werden können (user/event/comment)
    
    def __str__(self):
        if self.reported_user:
            return f"Report: {self.reporter.username} -> {self.reported_user.username} ({self.reason})"
        elif self.event:
            return f"Report: {self.reporter.username} -> Event '{self.event.title}' ({self.reason})"
        elif self.comment:
            return f"Report: {self.reporter.username} -> Comment by {self.comment.author.username} ({self.reason})"
        else:
            return f"Report: {self.reporter.username} ({self.reason})"
