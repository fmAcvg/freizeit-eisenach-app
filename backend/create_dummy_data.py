#!/usr/bin/env python
# Dieses Skript erstellt Test-Daten für die Eisenach-App
# Es wird genutzt, um die App mit Beispiel-Benutzern, Events und Kommentaren zu füllen
# Das ist wichtig für Tests und Demonstrationszwecke

import os
import sys
import django
from datetime import datetime, timedelta, date
import random

# Django-Umgebung initialisieren
# Damit können wir auf die Datenbank-Modelle zugreifen
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eisenach_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Event, EventParticipant, EventLike, EventComment, Friendship, Profile

def create_users():
    """
    Erstellt die gewünschten Test-Benutzer für die App
    Hinweis: Passwort für alle ist 'test123'
    """
    print("Erstelle Test-Benutzer...")
    
    # Liste mit allen Test-Benutzern
    # Diese Benutzer können später in der App zum Testen verwendet werden
    users_data = [
        # Vier geforderte Nutzer
        {'username': 'lars', 'email': 'lars@example.com', 'first_name': 'Lars', 'last_name': 'Muster'},
        {'username': 'lenny', 'email': 'lenny@example.com', 'first_name': 'Lenny', 'last_name': 'Beispiel'},
        {'username': 'valentin', 'email': 'valentin@example.com', 'first_name': 'Valentin', 'last_name': 'Test'},
        {'username': 'enzo', 'email': 'enzo@example.com', 'first_name': 'Enzo', 'last_name': 'Demo'},
        # Zwei zusätzliche neutrale Nutzer für Events/Netzwerk (optional)
        {'username': 'marie', 'email': 'marie@example.com', 'first_name': 'Marie', 'last_name': 'Klein'},
        {'username': 'jonas', 'email': 'jonas@example.com', 'first_name': 'Jonas', 'last_name': 'Lang'},
    ]
    
    users = []
    # Gehe durch alle Benutzer-Daten
    for user_data in users_data:
        # get_or_create holt den Benutzer falls er existiert, oder erstellt einen neuen
        # Das verhindert Duplikate beim mehrfachen Ausführen des Skripts
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_active': True
            }
        )
        if created:
            # Bei neuen Benutzern setze das Test-Passwort
            user.set_password('test123')
            user.save()
            users.append(user)
        else:
            # Benutzer existiert bereits
            users.append(user)
    
    print(f"OK - {len(users)} Benutzer erstellt/gefunden")
    return users

def create_profiles(users):
    """
    Erstellt Profile für alle Test-Benutzer
    Profile enthalten zusätzliche Informationen wie Bio, Wohnort und Geburtsdatum
    Jeder Benutzer bekommt ein individuelles Profil
    """
    print("Erstelle Benutzerprofile...")
    
    # Verschiedene Bio-Texte für die Test-Profile
    bios = [
        "Ich liebe es, neue Leute in Eisenach kennenzulernen!",
        "Sportbegeistert und immer für ein Abenteuer zu haben.",
        "Kulturfan und Stadtführerin in Eisenach.",
        "Student und Veranstaltungsorganisator.",
        "Fotograf und Event-Enthusiast.",
        "Musikerin und liebe es, Events zu besuchen."
    ]
    
    # Verschiedene Städte in der Region
    locations = ["Eisenach", "Gotha", "Erfurt", "Weimar", "Jena"]
    
    # Feste Geburtsdaten für gewünschte Altersangaben (Lars 13, Lenny 17, Valentin 12, Enzo 19)
    # Erklärung: Wir setzen explizite birth_date-Werte, damit die Alterslogik stabil ist
    today = date.today()
    def birth_date_from_age(age, month=6, day=15):
        return date(today.year - age, month, day)

    fixed_birthdays = {
        'lars': birth_date_from_age(13),
        'lenny': birth_date_from_age(17),
        'valentin': birth_date_from_age(12),
        'enzo': birth_date_from_age(19),
        # fallback für zusätzliche Nutzer
        'marie': birth_date_from_age(16),
        'jonas': birth_date_from_age(18),
    }
    
    profiles = []
    for i, user in enumerate(users):
        # Erstelle oder hole das Profil für jeden Benutzer
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                'bio': bios[i % len(bios)],
                'location': locations[i % len(locations)],
                'status': 'online' if i < 3 else 'offline',  # Erste 3 sind online
                'birth_date': fixed_birthdays.get(user.username, birth_date_from_age(16)),
                'age_visible': True,  # Alter ist standardmäßig sichtbar
                'profile_public': True,  # Profil ist öffentlich
                'events_public': True  # Event-Teilnahme ist öffentlich
            }
        )
        profiles.append(profile)
    
    print(f"OK - {len(profiles)} Profile erstellt")
    return profiles

def create_events(users):
    """Erstelle Test-Events basierend auf der gelieferten Tabelle (vereinfachte Abbildung).

    Abbildung aus der Tabelle → Modell-Felder:
    - laufend/einmalig: Wir setzen einfach ein anstehendes Datum in der Zukunft,
      damit Events in der App sichtbar sind. Das ursprüngliche Start-/Enddatum
      wird in der Beschreibung erwähnt.
    - Kategorie (z. B. Freizeit, Kultur, Engagement): landet als Stichwort in der Beschreibung.
    - Kosten 'frei': wird als 'Kostenlos' gesetzt.
    - Altersbereich 14–21: wir setzen min_age = 14 (max. Alter wird im Modell nicht geführt).
    - Link/Quelle: kommt in contact_info.
    """
    print("Erstelle Test-Veranstaltungen...")

    today = datetime.now()

    events_data = [
        {
            'title': 'Jugendforum Eisenach',
            'description': (
                'Austausch- und Beteiligungsangebot für Jugendliche in Eisenach. '\
                'Koordination durch Partnerschaft für Demokratie (Naturfreundejugend Thüringen, Regionalbüro Eisenach) '\
                'in Kooperation mit der Stadt Eisenach. Kategorie: Engagement/Beteiligung. Ursprünglicher Start: 2020-09-29.'
            ),
            'location': 'Stadt Eisenach / Jugendforum',
            'date': today + timedelta(days=3),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Weitere Infos: naturfreunde-eisenach.de / eisenach.de (Vielfalt tut gut)',
            'status': 'published'
        },
        {
            'title': '“WAKe up!” Jugendbeteiligungs-Festival',
            'description': (
                'Jugendbeteiligungs-Festival der Partnerschaft für Demokratie Eisenach & Wartburgkreis. '
                'Kategorie: Engagement/Beteiligung. Ursprünglich: 2022-05-14 bis 2022-05-15.'
            ),
            'location': 'Innenstadt Eisenach',
            'date': today + timedelta(days=14),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Kontakt: Jugendforum (E-Mail); Info: eisenachonline.de (WAKe up)',
            'status': 'published'
        },
        {
            'title': 'TechnoThek / Mach MI(N)T!',
            'description': (
                'Mitmach- und Technikangebote in der Stadtbibliothek Eisenach. '
                'Kategorie: Freizeit/Technik. Laufend seit 2022-01-01.'
            ),
            'location': 'Stadtbibliothek Eisenach',
            'date': today + timedelta(days=5),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Programm: Veranstaltungen der Stadtbibliothek (PDF)',
            'status': 'published'
        },
        {
            'title': 'Bereich „Junge Erwachsene“',
            'description': (
                'Angebote der Stadtbibliothek für Junge Erwachsene. Kategorie: Freizeit/Bibliothek. '
                'Laufend seit 2024-01-01.'
            ),
            'location': 'Stadtbibliothek Eisenach',
            'date': today + timedelta(days=6),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Programm: Veranstaltungen der Stadtbibliothek (PDF)',
            'status': 'published'
        },
        {
            'title': 'Kinder- und Jugendzentrum „Alte Posthalterei“',
            'description': (
                'Offene Kinder- und Jugendarbeit der Stadt Eisenach. Kategorie: Freizeit/Jugendzentrum. '
                'Laufend seit 2020-01-01.'
            ),
            'location': 'Alte Posthalterei, Eisenach',
            'date': today + timedelta(days=8),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Infos: eisenach.de → Kinder, Familie & Jugend → Jugendhäuser → Alte Posthalterei',
            'status': 'published'
        },
        {
            'title': 'Projekt „Mix it!“',
            'description': (
                'Beteiligungsprojekt der Naturfreundejugend Thüringen. Kategorie: Engagement/Beteiligung. '
                'Laufend.'
            ),
            'location': 'Eisenach / Region',
            'date': today + timedelta(days=9),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Weitere Infos: naturfreunde-eisenach.de/mix-it/',
            'status': 'published'
        },
        {
            'title': 'Jugendbeirat Eisenach',
            'description': (
                'Mitmachen im Jugendbeirat der Wartburgstadt Eisenach. Kategorie: Engagement/Beteiligung. '
                'Start: 2021-03-01.'
            ),
            'location': 'Rathaus Eisenach',
            'date': today + timedelta(days=11),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Infos: eisenach.de → Beiräte → Jugendbeirat',
            'status': 'published'
        },
        {
            'title': 'Lesung „Junge Texte aus Eisenach“',
            'description': (
                'Lesung mit jungen Autorinnen und Autoren aus Eisenach. Kategorie: Kultur/Lesung. '
                'Geplant (Demo) – ursprünglich 2025-06-26.'
            ),
            'location': 'Stadtbibliothek Eisenach',
            'date': today + timedelta(days=12),
            'cost': 'Kostenlos',
            'max_guests': 50,
            'min_age': 14,
            'contact_info': 'Programm: Stadtbibliothek (PDF)',
            'status': 'published'
        },
        {
            'title': 'Digitaltag „Was kann man mit KI machen?“',
            'description': (
                'Aktionstag zum Thema Künstliche Intelligenz in der Stadtbibliothek. Kategorie: Freizeit/Digitaltag. '
                'Ursprünglich 2025-06-27.'
            ),
            'location': 'Stadtbibliothek Eisenach',
            'date': today + timedelta(days=13),
            'cost': 'Kostenlos',
            'max_guests': None,
            'min_age': 14,
            'contact_info': 'Programm: Stadtbibliothek (PDF)',
            'status': 'published'
        },
        {
            'title': 'Workshop „What is Love?“',
            'description': (
                'Workshop-Reihe in der Stadtbibliothek. Kategorie: Kultur/Workshop. '
                'Ursprünglich 2025-06-30 bis 2025-07-04.'
            ),
            'location': 'Stadtbibliothek Eisenach',
            'date': today + timedelta(days=15),
            'cost': 'Kostenlos',
            'max_guests': 20,
            'min_age': 14,
            'contact_info': 'Programm: Stadtbibliothek (PDF)',
            'status': 'published'
        }
    ]

    events = []
    for i, event_data in enumerate(events_data):
        creator = users[i % len(users)]
        event, created = Event.objects.get_or_create(
            title=event_data['title'],
            defaults={
                **event_data,
                'created_by': creator,
                'published_at': datetime.now() - timedelta(days=random.randint(1, 5))
            }
        )
        events.append(event)

    print(f"OK - {len(events)} Veranstaltungen erstellt")
    return events

def create_participants(events, users):
    """Erstelle Teilnehmer für Events"""
    print("Erstelle Event-Teilnehmer...")
    
    participant_count = 0
    for event in events:
        print(f"   Event: {event.title} (Creator: {event.created_by.username})")
        
        # Teilnehmer-Pool ohne Ersteller
        pool = [u for u in users if u != event.created_by]

        # Altersfilter: Nur Nutzer zulassen, die min_age erfüllen
        if event.min_age is not None:
            def age_of(user):
                try:
                    prof = Profile.objects.get(user=user)
                    return prof.age or 0
                except Profile.DoesNotExist:
                    return 0
            pool = [u for u in pool if age_of(u) >= int(event.min_age or 0)]

        # Bestimme Zielanzahl: Wenn max_guests vorhanden, wähle bis max, sonst 0-6
        if event.max_guests is not None:
            # 30% der Events werden voll belegt, sonst 1- min(max, 4)
            if random.random() < 0.3:
                target = min(event.max_guests, len(pool))
            else:
                target = min(max(1, random.randint(1, 4)), event.max_guests, len(pool))
        else:
            target = min(random.randint(0, 6), len(pool))

        selected_users = random.sample(pool, target) if pool else []
        
        print(f"     Teilnehmer: {[u.username for u in selected_users]}")
        
        for user in selected_users:
            participant, created = EventParticipant.objects.get_or_create(
                event=event,
                user=user,
                defaults={
                'joined_at': datetime.now() - timedelta(days=random.randint(1, 10))
                }
            )
            if created:
                participant_count += 1
                print(f"       + {user.username} als Teilnehmer hinzugefügt")
            else:
                print(f"       i {user.username} war bereits Teilnehmer")
    
    print(f"OK - {participant_count} neue Teilnehmer erstellt")
    print(f"Gesamt EventParticipant-Objekte: {EventParticipant.objects.count()}")

def create_likes(events, users):
    """Erstelle Likes für Events"""
    print("Erstelle Event-Likes...")
    
    like_count = 0
    for event in events:
        # Jeder Event hat 5-15 Likes
        num_likes = random.randint(5, 15)
        selected_users = random.sample(users, min(num_likes, len(users)))
        
        for user in selected_users:
            like, created = EventLike.objects.get_or_create(
                event=event,
                user=user,
                defaults={
                    'created_at': datetime.now() - timedelta(days=random.randint(1, 15))
                }
            )
            if created:
                like_count += 1
    
    print(f"OK - {like_count} Likes erstellt")

def create_comments(events, users):
    """
    Erstellt Kommentare für alle Events
    Jedes Event bekommt 2-6 zufällige Kommentare von verschiedenen Benutzern
    Die Kommentare werden über die letzten 20 Tage verteilt
    """
    print("Erstelle Event-Kommentare...")
    
    # Verschiedene realistische Kommentar-Texte
    comments_data = [
        "Das klingt super! Ich bin dabei!",
        "Kann ich auch Freunde mitbringen?",
        "Perfekt! Ich habe schon lange auf so ein Event gewartet.",
        "Wann genau startet das Event?",
        "Bin leider an dem Tag verhindert, aber viel Spaß!",
        "Das wird bestimmt richtig cool!",
        "Ich bringe Snacks mit!",
        "Endlich mal was los in Eisenach!",
        "Kann man sich auch kurzfristig anmelden?",
        "Das Event sollte regelmäßig stattfinden!"
    ]
    
    comment_count = 0
    for event in events:
        # Nicht alle Events haben Kommentare: 70% Wahrscheinlichkeit
        if random.random() < 0.7:
            # Dieses Event bekommt zwischen 1 und 6 Kommentare
            num_comments = random.randint(1, 6)
            # Wähle zufällige Benutzer aus, die kommentieren
            selected_users = random.sample(users, min(num_comments, len(users)))
            
            for user in selected_users:
                # Erstelle den Kommentar mit einem zufälligen Text
                comment, created = EventComment.objects.get_or_create(
                    event=event,
                    author=user,
                    defaults={
                        'text': random.choice(comments_data),
                        # Kommentar ist zwischen 1 und 20 Tage alt
                        'created_at': datetime.now() - timedelta(days=random.randint(1, 20))
                    }
                )
                if created:
                    comment_count += 1
    
    print(f"OK - {comment_count} Kommentare erstellt")

def create_friendships(users):
    """Erstelle deterministische Freundschaften und Anfragen für alle Cases"""
    print("Erstelle Freundschaften & Anfragen (Cases)...")

    # Mapping für schnellen Zugriff
    by_name = {u.username: u for u in users}

    # Cases:
    # 1) accepted: Lars ↔ Lenny (bereits Freunde)
    lars = by_name.get('lars'); lenny = by_name.get('lenny')
    if lars and lenny:
        Friendship.objects.get_or_create(user1=min(lars, lenny, key=lambda u: u.id), user2=max(lars, lenny, key=lambda u: u.id))

    # 2) pending incoming: Für Lars liegt von Valentin eine Anfrage vor (Lars sieht eingehende Anfrage)
    valentin = by_name.get('valentin')
    if lars and valentin:
        # Direkte Freundschaft nicht anlegen, nur Anfrage
        from api.models import FriendshipRequest, FriendshipRequestStatus
        FriendshipRequest.objects.get_or_create(
            from_user=valentin,
            to_user=lars,
            defaults={'status': FriendshipRequestStatus.PENDING}
        )

    # 3) pending outgoing: Enzo hat Lenny angefragt (Enzo sieht gesendete Anfrage)
    enzo = by_name.get('enzo')
    if enzo and lenny:
        from api.models import FriendshipRequest, FriendshipRequestStatus
        FriendshipRequest.objects.get_or_create(
            from_user=enzo,
            to_user=lenny,
            defaults={'status': FriendshipRequestStatus.PENDING}
        )

    # 4) declined: Lars hatte Jonas angefragt, wurde abgelehnt
    jonas = by_name.get('jonas')
    if lars and jonas:
        from api.models import FriendshipRequest, FriendshipRequestStatus
        FriendshipRequest.objects.get_or_create(
            from_user=lars,
            to_user=jonas,
            defaults={'status': FriendshipRequestStatus.DECLINED}
        )

    # 5) cancelled: Marie hatte Valentin angefragt, dann storniert
    marie = by_name.get('marie')
    if marie and valentin:
        from api.models import FriendshipRequest, FriendshipRequestStatus
        req, _ = FriendshipRequest.objects.get_or_create(
            from_user=marie,
            to_user=valentin,
            defaults={'status': FriendshipRequestStatus.CANCELLED}
        )
        # sicherstellen, dass sie als storniert markiert ist
        if req.status != FriendshipRequestStatus.CANCELLED:
            req.status = FriendshipRequestStatus.CANCELLED
            req.save(update_fields=['status'])

    # Ausgabe
    total_friendships = Friendship.objects.count()
    from api.models import FriendshipRequest
    total_requests = FriendshipRequest.objects.count()
    print(f"OK - {total_friendships} Freundschaften, {total_requests} Anfragen erstellt/gesetzt")

# Benachrichtigungen wurden aus dem Dummy-Datensatz entfernt (Feature deaktiviert)

def main():
    print("Erstelle Dummy-Daten fuer die Eisenach-App...")
    print("=" * 50)
    
    # Lösche alte Daten (optional)
    print("Lösche alte Test-Daten...")
    # Reihenfolge beachten wegen FK-Constraints
    EventComment.objects.all().delete()
    EventLike.objects.all().delete()
    EventParticipant.objects.all().delete()
    Friendship.objects.all().delete()
    # Benachrichtigungen: entfernt
    Event.objects.all().delete()
    Profile.objects.all().delete()
    User.objects.filter(username__in=['lars', 'lenny', 'valentin', 'enzo', 'marie', 'jonas']).delete()
    
    # Erstelle neue Daten
    users = create_users()
    profiles = create_profiles(users)
    events = create_events(users)
    create_participants(events, users)
    create_likes(events, users)
    create_comments(events, users)
    create_friendships(users)
    # create_notifications(users) entfernt
    
    print("=" * 50)
    print("OK - Alle Dummy-Daten erfolgreich erstellt!")
    print("\nZusammenfassung:")
    print(f"- {User.objects.count()} Benutzer")
    print(f"- {Event.objects.count()} Veranstaltungen")
    print(f"- {EventParticipant.objects.count()} Teilnehmer")
    print(f"- {EventLike.objects.count()} Likes")
    print(f"- {EventComment.objects.count()} Kommentare")
    print(f"- {Friendship.objects.count()} Freundschaften")
    # print Benachrichtigungen entfernt
    
    # Detaillierte Validierung
    print("\nValidierung der erstellten Daten:")
    for user in users:
        created_events = Event.objects.filter(created_by=user)
        participated_events = Event.objects.filter(participants__user=user).distinct()
        participant_count = EventParticipant.objects.filter(user=user).count()
        
        print(f"User {user.username}:")
        print(f"   - Erstellt: {created_events.count()} Events")
        print(f"   - Teilnahme: {participated_events.count()} Events")
        print(f"   - EventParticipant-Objekte: {participant_count}")
    
    print("\nTest-Logins:")
    print("- lars / test123 (13 Jahre)")
    print("- lenny / test123 (17 Jahre)")
    print("- valentin / test123 (12 Jahre)")
    print("- enzo / test123 (19 Jahre)")
    print("- marie / test123 (16 Jahre)")
    print("- jonas / test123 (18 Jahre)")

if __name__ == '__main__':
    main()
