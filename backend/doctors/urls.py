# pyrefly: ignore [missing-import]
from django.urls import path
from doctors.views import (
    DoctorPatientsListView,
    DoctorPatientDetailView,
    DoctorPatientRecordsView,
    DoctorPatientAlertsView,
    DoctorPatientPrescriptionsView,
    DoctorAlertsView,
    DoctorEmergencyAlertsView,
    ResolveAlertView,
    DoctorPrescriptionsView,
    DoctorDashboardView,
)

urlpatterns = [
    # Dashboard stats
    path('dashboard/', DoctorDashboardView.as_view(), name='doctor-dashboard'),

    # Patient management — sub-routes must be before the detail route
    path('patients/', DoctorPatientsListView.as_view(), name='doctor-patients'),
    path('patients/<str:patient_id>/records/', DoctorPatientRecordsView.as_view(), name='doctor-patient-records'),
    path('patients/<str:patient_id>/alerts/', DoctorPatientAlertsView.as_view(), name='doctor-patient-alerts'),
    path('patients/<str:patient_id>/prescriptions/', DoctorPatientPrescriptionsView.as_view(), name='doctor-patient-prescriptions'),
    path('patients/<str:patient_id>/', DoctorPatientDetailView.as_view(), name='doctor-patient-detail'),

    # Alert management — emergency/ must come before <id>/ to avoid conflict
    path('alerts/emergency/', DoctorEmergencyAlertsView.as_view(), name='doctor-emergency-alerts'),
    path('alerts/', DoctorAlertsView.as_view(), name='doctor-alerts'),
    path('alerts/<int:alert_id>/resolve/', ResolveAlertView.as_view(), name='doctor-resolve-alert'),

    # Prescriptions
    path('prescriptions/', DoctorPrescriptionsView.as_view(), name='doctor-prescriptions'),
]
