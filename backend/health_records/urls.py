# pyrefly: ignore [missing-import]
from django.urls import path
from health_records.views import (
    HealthUploadView,
    SimulateHealthView,
    LatestHealthRecordView,
    PatientHealthRecordsView,
)

urlpatterns = [
    # IoT sensor upload (no JWT — uses X-Patient-ID header)
    path('upload/', HealthUploadView.as_view(), name='health-upload'),
    # Simulate a reading for testing without hardware
    path('simulate/', SimulateHealthView.as_view(), name='health-simulate'),
    # Latest reading for a patient
    path('latest/<str:patient_id>/', LatestHealthRecordView.as_view(), name='health-latest'),
    # All records for a patient (doctor only)
    path('records/<str:patient_id>/', PatientHealthRecordsView.as_view(), name='health-records'),
]
