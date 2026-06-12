"""
WebSocket URL routing for Django Channels — iHealth.

Routes:
  ws://<host>/ws/patient/<patient_id>/  →  PatientConsumer
  ws://<host>/ws/doctor/<doctor_id>/   →  DoctorConsumer
"""

# pyrefly: ignore [missing-import]
from django.urls import re_path
from websocket import consumers

websocket_urlpatterns = [
    # Patient real-time vitals feed — patient_id e.g. IH-20260001
    re_path(r'ws/patient/(?P<patient_id>[\w-]+)/$', consumers.PatientConsumer.as_asgi()),
    # Doctor alerts feed — doctor_id e.g. DR-20260001
    re_path(r'ws/doctor/(?P<doctor_id>[\w-]+)/$', consumers.DoctorConsumer.as_asgi()),
]
