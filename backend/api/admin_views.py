from django.contrib import admin
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .models import (
    Event, EventParticipant, EventLike, EventComment, 
    Friendship, UserRole, Profile, UserReport
)
from django.contrib.auth.models import User

# Prüfung ob User Admin-Rechte hat
def is_admin_user(user):
    return user.is_authenticated and user.is_staff

# Decorator für Admin-only Views
admin_required = user_passes_test(is_admin_user, login_url='/admin/login/')

@admin_required
def dashboard_view(request):
    """Start-Seite mit Statistiken und Übersicht"""
    
    # Grundlegende Statistiken sammeln
    stats = {
        'total_events': Event.objects.count(),
        'pending_events': Event.objects.filter(status='pending').count(),
        'published_events': Event.objects.filter(status='published').count(),
        'total_users': Profile.objects.count(),
        'active_users': Profile.objects.filter(status='online').count(),
        'total_comments': EventComment.objects.count(),
        'pending_reports': UserReport.objects.filter(status='pending').count(),
        'total_friendships': Friendship.objects.count(),
    }
    
    # Neueste Events für Übersicht
    recent_events = Event.objects.select_related('created_by').order_by('-created_at')[:5]
    
    # Events die Aufmerksamkeit brauchen (pending, viele Reports, etc.)
    urgent_events = Event.objects.filter(
        Q(status='pending') | Q(status='reported')
    ).order_by('-created_at')[:3]
    
    # Top Events nach Teilnehmern
    top_events = Event.objects.annotate(
        participant_count=Count('participants')
    ).filter(status='published').order_by('-participant_count')[:5]
    
    # User-Aktivität der letzten 7 Tage
    from datetime import timedelta
    week_ago = timezone.now() - timedelta(days=7)
    recent_users = Profile.objects.filter(created_at__gte=week_ago).count()
    
    context = {
        'stats': stats,
        'recent_events': recent_events,
        'urgent_events': urgent_events,
        'top_events': top_events,
        'recent_users': recent_users,
    }
    
    return render(request, 'admin/dashboard.html', context)

@admin_required
def moderation_view(request):
    """Moderation - Kommentare und Content verwalten"""
    
    # Kommentare mit Pagination
    comments = EventComment.objects.select_related('author', 'event').order_by('-created_at')
    paginator = Paginator(comments, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Kommentare nach verschiedenen Kriterien filtern
    filter_type = request.GET.get('filter', 'all')
    if filter_type == 'recent':
        comments = comments.filter(created_at__gte=timezone.now() - timezone.timedelta(days=1))
    elif filter_type == 'reported':
        # TODO: Implementiere Report-System für Kommentare
        pass
    
    # Kommentare nach Events gruppiert für bessere Übersicht
    comments_by_event = {}
    for comment in page_obj.object_list:
        event_id = comment.event.id
        if event_id not in comments_by_event:
            comments_by_event[event_id] = {
                'event': comment.event,
                'comments': []
            }
        comments_by_event[event_id]['comments'].append(comment)
    
    context = {
        'page_obj': page_obj,
        'comments_by_event': comments_by_event,
        'filter_type': filter_type,
    }
    
    return render(request, 'admin/moderation.html', context)

@admin_required
def event_requests_view(request):
    """Event-Anfragen Management"""
    
    if request.method == 'POST':
        action = request.POST.get('action')
        event_ids = request.POST.getlist('event_ids')
        
        if action == 'approve':
            updated = Event.objects.filter(id__in=event_ids, status='pending').update(
                status='published',
                published_at=timezone.now()
            )
            messages.success(request, f'✅ {updated} Events wurden akzeptiert und veröffentlicht.')
        elif action == 'reject':
            updated = Event.objects.filter(id__in=event_ids, status='pending').update(
                status='cancelled'
            )
            messages.success(request, f'❌ {updated} Events wurden abgelehnt.')
        
        return redirect('admin_event_requests')
    
    # Alle pending Events mit Details und Pagination
    pending_events = Event.objects.filter(status='pending').select_related('created_by').order_by('-created_at')
    
    # Zusätzliche Informationen zu jedem Event
    for event in pending_events:
        event.participant_count = event.participants.count()
        event.comment_count = event.comments.count()
        event.like_count = event.likes.count()
    
    paginator = Paginator(pending_events, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'total_pending': pending_events.count(),
    }
    
    return render(request, 'admin/event_requests.html', context)

@admin_required
def reports_view(request):
    """Reports - Nutzer-Beschwerden verwalten"""
    
    # Alle Reports mit Pagination
    reports = UserReport.objects.select_related('reporter', 'reported_user', 'event').order_by('-created_at')
    
    # Filter nach Status
    status_filter = request.GET.get('status', 'all')
    if status_filter == 'pending':
        reports = reports.filter(status='pending')
    elif status_filter == 'resolved':
        reports = reports.filter(status='resolved')
    elif status_filter == 'dismissed':
        reports = reports.filter(status='dismissed')
    
    paginator = Paginator(reports, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistiken für Reports
    report_stats = {
        'total': UserReport.objects.count(),
        'pending': UserReport.objects.filter(status='pending').count(),
        'resolved': UserReport.objects.filter(status='resolved').count(),
        'dismissed': UserReport.objects.filter(status='dismissed').count(),
    }
    
    context = {
        'page_obj': page_obj,
        'report_stats': report_stats,
        'status_filter': status_filter,
    }
    
    return render(request, 'admin/reports.html', context)

@admin_required
def database_view(request):
    """Datenbank-Management - Übersicht aller Models"""
    
    # Alle wichtigen Models mit Statistiken
    models_data = [
        {
            'name': 'Events',
            'model': Event,
            'count': Event.objects.count(),
            'recent': Event.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/event/',
            'icon': ''
        },
        {
            'name': 'Benutzer',
            'model': Profile,
            'count': Profile.objects.count(),
            'recent': Profile.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/profile/',
            'icon': ''
        },
        {
            'name': 'Kommentare',
            'model': EventComment,
            'count': EventComment.objects.count(),
            'recent': EventComment.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/eventcomment/',
            'icon': ''
        },
        {
            'name': 'Freundschaften',
            'model': Friendship,
            'count': Friendship.objects.count(),
            'recent': Friendship.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/friendship/',
            'icon': ''
        },
        {
            'name': 'Event-Teilnahmen',
            'model': EventParticipant,
            'count': EventParticipant.objects.count(),
            'recent': EventParticipant.objects.order_by('-joined_at')[:5],
            'url': '/admin-classic/api/eventparticipant/',
            'icon': ''
        },
        {
            'name': 'Event-Likes',
            'model': EventLike,
            'count': EventLike.objects.count(),
            'recent': EventLike.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/eventlike/',
            'icon': ''
        },
        {
            'name': 'Reports',
            'model': UserReport,
            'count': UserReport.objects.count(),
            'recent': UserReport.objects.order_by('-created_at')[:5],
            'url': '/admin-classic/api/userreport/',
            'icon': ''
        },
        
    ]
    
    # Zusätzliche Datenbank-Statistiken
    db_stats = {
        'total_events': Event.objects.count(),
        'published_events': Event.objects.filter(status='published').count(),
        'pending_events': Event.objects.filter(status='pending').count(),
        'total_users': Profile.objects.count(),
        'active_users': Profile.objects.filter(status='online').count(),
        'total_comments': EventComment.objects.count(),
        'total_reports': UserReport.objects.count(),
        'pending_reports': UserReport.objects.filter(status='pending').count(),
    }
    
    context = {
        'models_data': models_data,
        'db_stats': db_stats,
    }
    
    return render(request, 'admin/database.html', context)

@admin_required
def user_management_view(request):
    """User-Management - Benutzer sperren/löschen"""
    
    # Alle Benutzer mit Pagination
    users = User.objects.select_related('profile').order_by('-date_joined')
    
    # Filter nach Status
    status_filter = request.GET.get('status', 'all')
    if status_filter == 'active':
        users = users.filter(is_active=True)
    elif status_filter == 'inactive':
        users = users.filter(is_active=False)
    
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Statistiken für Users
    user_stats = {
        'total': User.objects.count(),
        'active': User.objects.filter(is_active=True).count(),
        'inactive': User.objects.filter(is_active=False).count(),
        'staff': User.objects.filter(is_staff=True).count(),
        'superuser': User.objects.filter(is_superuser=True).count(),
    }
    
    context = {
        'page_obj': page_obj,
        'user_stats': user_stats,
        'status_filter': status_filter,
    }
    
    return render(request, 'admin/user_management.html', context)

# API-Endpunkte für AJAX-Requests
@csrf_exempt
@require_http_methods(["POST"])
def approve_event_api(request, event_id):
    """API: Event akzeptieren"""
    try:
        event = get_object_or_404(Event, id=event_id, status='pending')
        event.status = 'published'
        event.published_at = timezone.now()
        event.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Event "{event.title}" wurde erfolgreich akzeptiert.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def reject_event_api(request, event_id):
    """API: Event ablehnen"""
    try:
        event = get_object_or_404(Event, id=event_id, status='pending')
        event.status = 'cancelled'
        event.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Event "{event.title}" wurde abgelehnt.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_comment_api(request, comment_id):
    """API: Kommentar löschen"""
    try:
        comment = get_object_or_404(EventComment, id=comment_id)
        comment.delete()
        
        return JsonResponse({
            'success': True, 
            'message': 'Kommentar wurde erfolgreich gelöscht.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def resolve_report_api(request, report_id):
    """API: Report als erledigt markieren"""
    try:
        report = get_object_or_404(UserReport, id=report_id)
        report.status = 'resolved'
        report.resolved_at = timezone.now()
        report.admin_notes = f"Resolved by {request.user.username} at {timezone.now()}"
        report.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Report #{report_id} wurde als erledigt markiert.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def dismiss_report_api(request, report_id):
    """API: Report ablehnen"""
    try:
        report = get_object_or_404(UserReport, id=report_id)
        report.status = 'dismissed'
        report.resolved_at = timezone.now()
        report.admin_notes = f"Dismissed by {request.user.username} at {timezone.now()}"
        report.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Report #{report_id} wurde abgelehnt.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_user_completely_api(request, user_id):
    """API: Nutzer komplett löschen - alle seine Daten entfernen"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Sammle alle Daten des Nutzers
        user_data = {
            'username': user.username,
            'email': user.email,
            'events_created': user.created_events.count(),
            'comments_made': user.event_comments.count(),
            'participations': user.event_participations.count(),
            'likes_given': user.event_likes.count(),
            'friendships': Friendship.objects.filter(Q(user1=user) | Q(user2=user)).count(),
            'reports_made': user.reports_made.count(),
            'reports_received': user.reports_received.count(),
        }
        
        # Lösche alle Daten des Nutzers
        deleted_items = []
        
        # 1. Event-Teilnahmen löschen
        participations = user.event_participations.all()
        deleted_items.append(f"{participations.count()} Event-Teilnahmen")
        participations.delete()
        
        # 2. Event-Likes löschen
        likes = user.event_likes.all()
        deleted_items.append(f"{likes.count()} Event-Likes")
        likes.delete()
        
        # 3. Kommentare löschen
        comments = user.event_comments.all()
        deleted_items.append(f"{comments.count()} Kommentare")
        comments.delete()
        
        # 4. Freundschaften löschen
        friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user))
        deleted_items.append(f"{friendships.count()} Freundschaften")
        friendships.delete()
        
        # 5. Events des Nutzers löschen (mit allen zugehörigen Daten)
        user_events = user.created_events.all()
        for event in user_events:
            # Lösche alle Teilnahmen an diesem Event
            EventParticipant.objects.filter(event=event).delete()
            # Lösche alle Likes für dieses Event
            EventLike.objects.filter(event=event).delete()
            # Lösche alle Kommentare zu diesem Event
            EventComment.objects.filter(event=event).delete()
            # Lösche alle Reports für dieses Event
            UserReport.objects.filter(event=event).delete()
        
        deleted_items.append(f"{user_events.count()} erstellte Events")
        user_events.delete()
        
        # 6. Reports des Nutzers löschen
        user_reports_made = user.reports_made.all()
        deleted_items.append(f"{user_reports_made.count()} gemachte Reports")
        user_reports_made.delete()
        
        # 7. Reports über den Nutzer löschen
        user_reports_received = user.reports_received.all()
        deleted_items.append(f"{user_reports_received.count()} erhaltene Reports")
        user_reports_received.delete()
        
        # 8. User-Rollen löschen
        user_roles = user.roles.all()
        deleted_items.append(f"{user_roles.count()} User-Rollen")
        user_roles.delete()
        
        # 9. Profil löschen
        try:
            profile = user.profile
            deleted_items.append("1 Profil")
            profile.delete()
        except:
            pass  # Profil existiert möglicherweise nicht
        
        # 10. Zum Schluss den User selbst löschen
        username = user.username
        user.delete()
        
        # Log die Aktion
        admin_username = request.user.username
        action_log = f"User '{username}' komplett gelöscht von {admin_username} am {timezone.now()}. Gelöscht: {', '.join(deleted_items)}"
        
        return JsonResponse({
            'success': True, 
            'message': f'Nutzer "{username}" wurde komplett gelöscht.',
            'deleted_items': deleted_items,
            'action_log': action_log
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler beim Löschen des Nutzers: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def ban_user_api(request, user_id):
    """API: Nutzer sperren"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Verhindere das Sperren von Superusern oder Staff-Mitgliedern
        if user.is_superuser or user.is_staff:
            return JsonResponse({
                'success': False, 
                'message': 'Superuser und Staff-Mitglieder können nicht gesperrt werden.'
            })
        
        user.is_active = False
        user.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Nutzer "{user.username}" wurde gesperrt.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def unban_user_api(request, user_id):
    """API: Nutzer entsperren"""
    try:
        user = get_object_or_404(User, id=user_id)
        user.is_active = True
        user.save()
        
        return JsonResponse({
            'success': True, 
            'message': f'Nutzer "{user.username}" wurde entsperrt.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Fehler: {str(e)}'
        })
