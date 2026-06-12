"""
Main URL configuration for iHealth project.
All API routes are namespaced under /api/
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/doctors/', include('doctors.urls')),
    path('api/health/', include('health_records.urls')),
    path('api/alerts/', include('alerts.urls')),
]
