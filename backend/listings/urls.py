from django.urls import path

from .views import (
    AdminLeadDetailAPI,
    AdminLeadListAPI,
    AdminPropertyListCreateAPI,
    AdminStatsAPI,
    LeadCreateAPI,
    LocalityListAPI,
    MetaAPI,
    PropertyListAPI,
)

urlpatterns = [
    path('meta/', MetaAPI.as_view(), name='meta'),
    path('properties/', PropertyListAPI.as_view(), name='properties'),
    path('localities/', LocalityListAPI.as_view(), name='localities'),
    path('leads/', LeadCreateAPI.as_view(), name='leads'),
    path('admin/stats/', AdminStatsAPI.as_view(), name='admin-stats'),
    path('admin/leads/', AdminLeadListAPI.as_view(), name='admin-leads'),
    path('admin/leads/<int:pk>/', AdminLeadDetailAPI.as_view(), name='admin-lead-detail'),
    path('admin/properties/', AdminPropertyListCreateAPI.as_view(), name='admin-properties'),
]
