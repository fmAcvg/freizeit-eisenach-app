from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from django.core.cache import cache
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
import os
import uuid
from PIL import Image
from .serializers import UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Benutzer-Login API
    Erwartet: {'username': '...', 'password': '...'}
    Gibt zurück: {'token': '...', 'user': {...}}
    """
    # Erlaubt Login per Benutzername ODER E-Mail (case-insensitive)
    identifier = request.data.get('username') or request.data.get('identifier') or request.data.get('email')
    password = request.data.get('password')
    
    if not identifier or not password:
        return Response(
            {'error': 'Benutzername/E-Mail und Passwort sind erforderlich'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Versuche zuerst exakten/ci-Benutzernamen, dann E-Mail
    auth_user = None
    try:
        candidate_username = None
        user_by_username = User.objects.filter(username__iexact=identifier).first()
        if user_by_username:
            candidate_username = user_by_username.username
        else:
            user_by_email = User.objects.filter(email__iexact=identifier).first()
            if user_by_email:
                candidate_username = user_by_email.username
        if candidate_username:
            auth_user = authenticate(username=candidate_username, password=password)
        else:
            # Fallback: direkt mit identifier versuchen (falls exakter Username übermittelt wurde)
            auth_user = authenticate(username=identifier, password=password)
    except Exception:
        auth_user = authenticate(username=identifier, password=password)

    if auth_user:
        token, created = Token.objects.get_or_create(user=auth_user)
        return Response({
            'token': token.key,
            'user': UserSerializer(auth_user).data
        })
    else:
        return Response(
            {'error': 'Ungültige Anmeldedaten'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    """
    Benutzer-Registrierung API
    Erwartet: {'username': '...', 'email': '...', 'password': '...', 'first_name': '...', 'last_name': '...'}
    Gibt zurück: {'token': '...', 'user': {...}}
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    birth_date = request.data.get('birth_date')  # Neues Feld für Geburtsdatum
    
    if not username or not email or not password:
        return Response(
            {'error': 'Benutzername, E-Mail und Passwort sind erforderlich'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Benutzername bereits vergeben'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # E-Mail normalisieren (case-insensitive prüfen)
    try:
        email_norm = email.strip().lower()
    except Exception:
        email_norm = email
    
    if User.objects.filter(email__iexact=email_norm).exists():
        return Response(
            {'error': 'E-Mail bereits registriert'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email_norm,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    # Profil erstellen mit Geburtsdatum
    from .models import Profile
    from datetime import datetime
    profile_data = {'user': user}
    if birth_date:
        # Akzeptiere mehrere Formate; bei Fehler: Feld ignorieren (nicht abbrechen)
        from datetime import datetime as dt
        parsed = None
        if isinstance(birth_date, str):
            for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%Y/%m/%d'):
                try:
                    parsed = dt.strptime(birth_date.strip(), fmt).date()
                    break
                except ValueError:
                    continue
        elif hasattr(birth_date, 'year'):
            parsed = birth_date
        if parsed:
            profile_data['birth_date'] = parsed
    Profile.objects.create(**profile_data)
    
    token = Token.objects.create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def logout_view(request):
    """
    Benutzer-Logout API
    Löscht das Token des Benutzers
    """
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Erfolgreich abgemeldet'})
    except:
        return Response({'error': 'Fehler beim Abmelden'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def user_profile_view(request):
    """
    Aktueller Benutzer-Profil API
    GET: Gibt das Profil des angemeldeten Benutzers zurück
    PATCH: Aktualisiert das Profil des angemeldeten Benutzers
    """
    try:
        from .models import Profile
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        # Profil erstellen falls es nicht existiert
        profile = Profile.objects.create(user=request.user)
    
    if request.method == 'GET':
        from .serializers import ProfileSerializer
        return Response(ProfileSerializer(profile).data)
    
    elif request.method == 'PATCH':
        from .serializers import ProfileSerializer
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def upload_profile_image(request):
    """
    Profilbild-Upload API
    POST: Lädt ein Profilbild für den angemeldeten Benutzer hoch
    """
    try:
        from .models import Profile
        
        # Profil abrufen oder erstellen
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=request.user)
        
        # Prüfe ob Bild hochgeladen wurde
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Kein Bild hochgeladen'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validiere Dateityp
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Nur JPEG und PNG Dateien sind erlaubt'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validiere Dateigröße (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Datei ist zu groß (max 5MB)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Lösche altes Profilbild falls vorhanden
        if profile.avatar:
            try:
                if os.path.isfile(profile.avatar.path):
                    os.remove(profile.avatar.path)
            except:
                pass
        
        # Generiere eindeutigen Dateinamen
        file_extension = os.path.splitext(image_file.name)[1].lower()
        unique_filename = f"profile_{request.user.id}_{uuid.uuid4().hex[:8]}{file_extension}"
        
        # Speichere das Bild
        profile.avatar.save(unique_filename, image_file, save=True)
        
        # Komprimiere das Bild
        try:
            with Image.open(profile.avatar.path) as img:
                # Konvertiere zu RGB falls nötig
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize auf max 500x500
                img.thumbnail((500, 500), Image.Resampling.LANCZOS)
                img.save(profile.avatar.path, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            print(f"Fehler beim Komprimieren des Bildes: {e}")
        
        from .serializers import ProfileSerializer
        return Response({
            'message': 'Profilbild erfolgreich hochgeladen',
            'profile': ProfileSerializer(profile).data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Fehler beim Hochladen: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def delete_profile_image(request):
    """
    Profilbild-Löschung API
    DELETE: Löscht das Profilbild des angemeldeten Benutzers
    """
    try:
        from .models import Profile
        
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profil nicht gefunden'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Lösche Profilbild falls vorhanden
        if profile.avatar:
            try:
                if os.path.isfile(profile.avatar.path):
                    os.remove(profile.avatar.path)
            except:
                pass
            
            profile.avatar = None
            profile.save()
            
            from .serializers import ProfileSerializer
            return Response({
                'message': 'Profilbild erfolgreich gelöscht',
                'profile': ProfileSerializer(profile).data
            })
        else:
            return Response(
                {'error': 'Kein Profilbild vorhanden'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Fehler beim Löschen: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========= Passwort-Zurücksetzen (per E-Mail) =========

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Startet den Passwort-Zurücksetzen-Prozess.
    Erwartet: { "email": "..." }
    Sendet einen Link mit Token an die E-Mail, falls User existiert (silent success aus Sicherheitsgründen).
    """
    # Nur im Debug-Modus aktiv; in Produktion deaktiviert
    if not getattr(settings, 'DEBUG', False):
        return Response({'detail': 'Endpoint deaktiviert'}, status=status.HTTP_404_NOT_FOUND)
    email = request.data.get('email')
    if not email:
        return Response({ 'error': 'E-Mail ist erforderlich' }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Aus Sicherheitsgründen immer Erfolg melden
        return Response({ 'message': 'Wenn die E-Mail existiert, wurde eine Nachricht gesendet.' })

    # Token und UID erzeugen (Fallback-Link)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    # Link zusammenbauen (API-Link; App kann auch UID/Token direkt nutzen)
    try:
        reset_url = request.build_absolute_uri(f"/api/auth/password-reset/confirm/?uid={uidb64}&token={token}")
    except Exception:
        reset_url = f"/api/auth/password-reset/confirm/?uid={uidb64}&token={token}"

    # 6-stelligen Code generieren und 10 Minuten speichern
    import random
    code = f"{random.randint(0, 999999):06d}"
    cache_key = f"pwd_reset:{user.id}"
    cache.set(cache_key, code, timeout=600)  # 10 Minuten gültig

    subject = 'Passwort zurücksetzen - Eisenach App'
    message = (
        'Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.\n\n'
        'Du kannst entweder den folgenden Code in der App eingeben oder den Link öffnen.\n\n'
        f'CODE: {code}\n\n'
        'Alternativ-Link (UID/Token):\n'
        f'{reset_url}\n\n'
        'Falls du die Anfrage nicht gestellt hast, ignoriere bitte diese E-Mail.'
    )
    
    # Hinweis: In Entwicklungsumgebungen kann das Senden scheitern (Firewall/SMTP). 
    # Wir melden dem Client trotzdem Erfolg, um keine 500 an der UI zu erzeugen.
    if not getattr(settings, 'DEBUG', False):
        try:
            send_result = send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                [email],
                fail_silently=False
            )
            if send_result != 1:
                print('Passwort-Reset: E-Mail wurde nicht gesendet (send_result != 1). Prüfe SMTP-Zugangsdaten/Firewall.')
        except Exception as e:
            # Für Produktion loggen; Client trotzdem Erfolg (kein 500 in der App)
            print(f"Passwort-Reset: SMTP-Fehler: {e}")

    if getattr(settings, 'DEBUG', False):
        return Response({ 'message': 'Wenn die E-Mail existiert, wurde eine Nachricht gesendet.', 'debug_code': code, 'debug_username': user.username })
    return Response({ 'message': 'Wenn die E-Mail existiert, wurde eine Nachricht gesendet.' })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_code(request):
    """
    Passwort-Zurücksetzen per 6-stelligem Code.
    Erwartet: { "email": "..." ODER "username": "...", "code": "123456", "new_password": "..." }
    """
    # Nur im Debug-Modus aktiv; in Produktion deaktiviert
    if not getattr(settings, 'DEBUG', False):
        return Response({'detail': 'Endpoint deaktiviert'}, status=status.HTTP_404_NOT_FOUND)
    email = request.data.get('email')
    username = request.data.get('username')
    code = request.data.get('code')
    new_password = request.data.get('new_password')

    if not code or not new_password or (not email and not username):
        return Response({ 'error': 'E-Mail/Benutzername, Code und neues Passwort sind erforderlich' }, status=status.HTTP_400_BAD_REQUEST)

    # Benutzer auflösen (E-Mail hat Vorrang)
    try:
        if email:
            user = User.objects.get(email__iexact=email.strip())
        else:
            user = User.objects.get(username=username.strip())
    except User.DoesNotExist:
        # Aus Sicherheitsgründen keine Details verraten
        return Response({ 'error': 'Ungültige Anfrage' }, status=status.HTTP_400_BAD_REQUEST)

    cache_key = f"pwd_reset:{user.id}"
    stored = cache.get(cache_key)
    if not stored or stored != str(code).strip():
        return Response({ 'error': 'Ungültiger oder abgelaufener Code' }, status=status.HTTP_400_BAD_REQUEST)

    # Passwort setzen und Code invalidieren
    user.set_password(new_password)
    user.save()
    cache.delete(cache_key)

    return Response({ 'message': 'Passwort wurde erfolgreich geändert.' })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Setzt das Passwort mit UID und Token neu.
    Erwartet: { "uid": "...", "token": "...", "new_password": "..." }
    """
    # Nur im Debug-Modus aktiv; in Produktion deaktiviert
    if not getattr(settings, 'DEBUG', False):
        return Response({'detail': 'Endpoint deaktiviert'}, status=status.HTTP_404_NOT_FOUND)
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not uidb64 or not token or not new_password:
        return Response({ 'error': 'UID, Token und neues Passwort sind erforderlich' }, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        return Response({ 'error': 'Ungültige Anfrage' }, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({ 'error': 'Ungültiger oder abgelaufener Token' }, status=status.HTTP_400_BAD_REQUEST)

    # Passwort setzen
    user.set_password(new_password)
    user.save()

    return Response({ 'message': 'Passwort wurde erfolgreich geändert.' })
