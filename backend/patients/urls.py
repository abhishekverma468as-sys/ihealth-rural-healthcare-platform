# pyrefly: ignore [missing-import]
from django.urls import path
from patients.views import (
    PatientProfileView,
    PatientProfileUpdateView,
    PatientDashboardView,
    PatientHealthHistoryView,
    PatientPrescriptionsView,
)

urlpatterns = [
    path('profile/', PatientProfileView.as_view(), name='patient-profile'),
    path('profile/update/', PatientProfileUpdateView.as_view(), name='patient-profile-update'),
    path('dashboard/', PatientDashboardView.as_view(), name='patient-dashboard'),
    path('history/', PatientHealthHistoryView.as_view(), name='patient-history'),
    path('prescriptions/', PatientPrescriptionsView.as_view(), name='patient-prescriptions'),
]
