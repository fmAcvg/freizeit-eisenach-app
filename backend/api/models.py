from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# Hier definiere ich die Datenbankmodelle für unsere Eisenach-App

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
    # Das Event-Modell speichert alle Veranstaltungen in Eisenach
    # Jede Veranstaltung hat einen Titel, Beschreibung, Ort und Datum
    title = models.CharField(max_length=200)  # Name der Veranstaltung
    description = models.TextField()  # Detaillierte Beschreibung (nicht optional)
    date = models.DateTimeField()  # Wann findet es statt?
    location = models.CharField(max_length=200)  # Wo findet es statt? (nicht optional)
    image_url = models.URLField(blank=True, null=True)  # Bild-URL für die Veranstaltung
    image = models.ImageField(upload_to='event_images/', blank=True, null=True)  # Hochgeladenes Bild
    cost = models.CharField(max_length=50, blank=True)  # Kosten (z.B. "Kostenlos", "5€")
    contact_info = models.TextField(blank=True)  # Kontaktinformationen (optional)
    max_guests = models.PositiveIntegerField(blank=True, null=True)  # Maximale Teilnehmerzahl
    min_age = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(0)])  # Mindestalter
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.DRAFT)  # Status der Veranstaltung
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')  # Wer hat es erstellt?
    created_at = models.DateTimeField(auto_now_add=True)  # Automatisch: Erstellungsdatum
    updated_at = models.DateTimeField(auto_now=True)  # Automatisch: Letzte Änderung
    published_at = models.DateTimeField(blank=True, null=True)  # Wann wurde es veröffentlicht?
    
    class Meta:
        ordering = ['-date']  # Sortierung: Neueste zuerst
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['status']),
            models.Index(fields=['date']),
            models.Index(fields=['status', 'date']),
        ]
    
    def get_image_url(self):
        """Gibt die Bild-URL zurück - entweder hochgeladenes Bild oder externe URL"""
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None

    def __str__(self):
        return self.title  # Für Admin-Interface: Zeige den Titel

class EventParticipant(models.Model):
    # Dieses Modell verknüpft Benutzer mit Veranstaltungen
    # Es zeigt an, wer an welcher Veranstaltung teilnimmt
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='participants')  # Welche Veranstaltung?
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_participations')  # Welcher Benutzer?
    joined_at = models.DateTimeField(auto_now_add=True)  # Wann hat er sich angemeldet?
    
    class Meta:
        unique_together = ['event', 'user']  # Ein Benutzer kann sich nur einmal pro Veranstaltung anmelden
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['event']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"  # Für Admin: "Benutzername - Veranstaltung"

class EventLike(models.Model):
    # Modell für Event-Likes von Benutzern
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='likes')  # Welche Veranstaltung?
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_likes')  # Welcher Benutzer?
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde geliked?
    
    class Meta:
        unique_together = ['event', 'user']  # Ein Benutzer kann ein Event nur einmal liken
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} liked {self.event.title}"

class EventComment(models.Model):
    # Modell für Kommentare zu Events
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='comments')  # Welche Veranstaltung?
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_comments')  # Wer hat kommentiert?
    text = models.TextField()  # Kommentar-Text
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde kommentiert?
    
    class Meta:
        ordering = ['-created_at']  # Neueste Kommentare zuerst
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['author']),
            models.Index(fields=['event', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.author.username} kommentierte {self.event.title}"

class Friendship(models.Model):
    # Modell für Freundschaftsbeziehungen zwischen Benutzern
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_as_user1')  # Erster Benutzer
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships_as_user2')  # Zweiter Benutzer
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde die Freundschaft geschlossen?
    
    class Meta:
        unique_together = ['user1', 'user2']  # Eine Freundschaft kann nur einmal existieren
        indexes = [
            models.Index(fields=['user1']),
            models.Index(fields=['user2']),
        ]
    
    def __str__(self):
        return f"{self.user1.username} - {self.user2.username}"

class FriendshipRequest(models.Model):
    # Modell für Freundschafts-Anfragen
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests')  # Wer sendet die Anfrage?
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests')  # Wer erhält die Anfrage?
    status = models.CharField(max_length=20, choices=FriendshipRequestStatus.choices, default=FriendshipRequestStatus.PENDING)  # Status der Anfrage
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde die Anfrage gesendet?
    updated_at = models.DateTimeField(auto_now=True)  # Wann wurde sie zuletzt bearbeitet?
    message = models.TextField(blank=True, null=True)  # Optional: Nachricht mit der Anfrage
    
    class Meta:
        unique_together = ['from_user', 'to_user']  # Eine Anfrage zwischen zwei Benutzern nur einmal
        indexes = [
            models.Index(fields=['from_user']),
            models.Index(fields=['to_user']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username} ({self.status})"

class UserRole(models.Model):
    # Einfache Benutzerrollen (admin, user)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')  # Welcher Benutzer?
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'Benutzer')])  # Welche Rolle?
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde die Rolle vergeben?
    
    class Meta:
        unique_together = ['user', 'role']  # Ein Benutzer kann eine Rolle nur einmal haben
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Notification(models.Model):
    # Benachrichtigungen für Benutzer
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')  # Empfänger
    type = models.CharField(max_length=20, choices=NotificationType.choices)  # Art der Benachrichtigung
    title = models.CharField(max_length=200)  # Titel der Benachrichtigung
    message = models.TextField()  # Nachrichtentext
    is_read = models.BooleanField(default=False)  # Wurde die Benachrichtigung gelesen?
    data = models.JSONField(blank=True, null=True)  # Zusätzliche Daten (optional)
    created_at = models.DateTimeField(auto_now_add=True)  # Wann wurde sie erstellt?
    
    class Meta:
        ordering = ['-created_at']  # Neueste Benachrichtigungen zuerst
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.username}: {self.title}"

class Profile(models.Model):
    # Benutzerprofile erweitern die Standard-Benutzerdaten
    # Jeder Benutzer kann zusätzliche Informationen wie Bio und Avatar haben
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')  # Verknüpfung zu Benutzer
    bio = models.TextField(blank=True)  # Kurze Selbstbeschreibung (optional)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  # Profilbild (optional)
    location = models.CharField(max_length=100, blank=True)  # Wohnort des Benutzers
    status = models.CharField(max_length=20, choices=UserStatus.choices, default=UserStatus.OFFLINE)  # Online-Status
    
    # Alters-Informationen
    birth_date = models.DateField(blank=True, null=True)  # Geburtsdatum für Altersberechnung
    age_visible = models.BooleanField(default=True)  # Alter öffentlich sichtbar
    
    # Datenschutz-Einstellungen
    profile_public = models.BooleanField(default=True)  # Profil öffentlich sichtbar
    events_public = models.BooleanField(default=True)   # Event-Teilnahme öffentlich sichtbar
    
    created_at = models.DateTimeField(auto_now_add=True)  # Automatisch: Erstellungsdatum
    updated_at = models.DateTimeField(auto_now=True)  # Automatisch: Letzte Änderung
    
    @property
    def age(self):
        """Berechnet das aktuelle Alter basierend auf dem Geburtsdatum"""
        if not self.birth_date:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
    
    def __str__(self):
        return f"{self.user.username}'s Profile"  # Für Admin: "Benutzername's Profil"

class UserReport(models.Model):
    # Modell für Nutzer-Meldungen
    # Ermöglicht es Nutzern, andere Nutzer, Events oder Kommentare zu melden
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')  # Wer meldet
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received', blank=True, null=True)  # Wer wird gemeldet
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reports', blank=True, null=True)  # Event wird gemeldet
    comment = models.ForeignKey('EventComment', on_delete=models.CASCADE, related_name='reports', blank=True, null=True)  # Kommentar wird gemeldet
    reason = models.CharField(max_length=30, choices=ReportReason.choices)  # Grund der Meldung
    description = models.TextField(blank=True)  # Zusätzliche Beschreibung (optional)
    status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.PENDING)  # Status der Meldung
    admin_notes = models.TextField(blank=True)  # Notizen der Admins (optional)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatisch: Erstellungsdatum
    updated_at = models.DateTimeField(auto_now=True)  # Automatisch: Letzte Änderung
    resolved_at = models.DateTimeField(blank=True, null=True)  # Wann wurde es gelöst?
    
    class Meta:
        ordering = ['-created_at']  # Sortierung: Neueste zuerst
        indexes = [
            models.Index(fields=['reporter']),
            models.Index(fields=['reported_user']),
            models.Index(fields=['status']),
            models.Index(fields=['reason']),
            models.Index(fields=['status', 'created_at']),
        ]
        # Entferne unique_together da wir jetzt User-, Event- und Comment-Reports haben
        # unique_together = ['reporter', 'reported_user']  # Ein Nutzer kann einen anderen nur einmal melden
    
    def __str__(self):
        if self.reported_user:
            return f"Report: {self.reporter.username} -> {self.reported_user.username} ({self.reason})"
        elif self.event:
            return f"Report: {self.reporter.username} -> Event '{self.event.title}' ({self.reason})"
        elif self.comment:
            return f"Report: {self.reporter.username} -> Comment by {self.comment.author.username} ({self.reason})"
        else:
            return f"Report: {self.reporter.username} ({self.reason})"
