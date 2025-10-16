from django.urls import path
from .admin_views import (
    dashboard_view,
    moderation_view,
    event_requests_view,
    reports_view,
    database_view,
    user_management_view,
    approve_event_api,
    reject_event_api,
    delete_comment_api,
    resolve_report_api,
    dismiss_report_api,
    delete_user_completely_api,
    ban_user_api,
    unban_user_api,
)

# URL-Patterns für das Custom Admin-Dashboard
urlpatterns = [
    # Haupt-Views
    path('', dashboard_view, name='admin_dashboard'),
    path('moderation/', moderation_view, name='admin_moderation'),
    path('event-requests/', event_requests_view, name='admin_event_requests'),
    path('reports/', reports_view, name='admin_reports'),
    path('users/', user_management_view, name='admin_user_management'),
    path('database/', database_view, name='admin_database'),
    
    # API-Endpunkte für AJAX-Requests
    path('api/approve-event/<int:event_id>/', approve_event_api, name='admin_approve_event_api'),
    path('api/reject-event/<int:event_id>/', reject_event_api, name='admin_reject_event_api'),
    path('api/delete-comment/<int:comment_id>/', delete_comment_api, name='admin_delete_comment_api'),
    path('api/resolve-report/<int:report_id>/', resolve_report_api, name='admin_resolve_report_api'),
    path('api/dismiss-report/<int:report_id>/', dismiss_report_api, name='admin_dismiss_report_api'),
    path('api/delete-user/<int:user_id>/', delete_user_completely_api, name='admin_delete_user_api'),
    path('api/ban-user/<int:user_id>/', ban_user_api, name='admin_ban_user_api'),
    path('api/unban-user/<int:user_id>/', unban_user_api, name='admin_unban_user_api'),
]
