"""
Health Records API Views — iHealth

POST /api/health/upload/          — Sensor data upload (no JWT, uses X-Patient-ID header)
POST /api/health/simulate/        — Simulate a health reading for testing
GET  /api/health/latest/<pid>/    — Latest HealthRecord for a patient
GET  /api/health/records/<pid>/   — All records for a patient (doctor only)
"""

import logging
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated, AllowAny

from channels.layers import get_channel_layer
# pyrefly: ignore [missing-import]
from asgiref.sync import async_to_sync

from patients.models import PatientProfile
from health_records.models import HealthRecord
from health_records.serializers import HealthRecordSerializer
from health_records.analysis import analyze_health
from health_records.recommendations import get_recommendations
from alerts.models import Alert
from alerts.email_alert import send_emergency_email, send_warning_email

logger = logging.getLogger(__name__)

# ── Helper: broadcast via Django Channels ─────────────────────────────────────

def broadcast_health_update(patient, health_record, recs):
    """Send real-time WebSocket update to the patient's group."""
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            f"patient_{patient.patient_id}",
            {
                "type": "health_update",
                "pulse_rate": health_record.pulse_rate,
                "spo2": health_record.spo2,
                "temperature": health_record.temperature,
                "status": health_record.status,
                "analysis_note": health_record.analysis_note,
                "recommendations": recs,
                "timestamp": health_record.timestamp.isoformat(),
            }
        )
    except Exception as e:
        logger.warning(f"WebSocket broadcast to patient failed: {e}")


def broadcast_doctor_alert(patient, health_record, alert_type, alert_id):
    """Send real-time WebSocket alert to ALL doctors group."""
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)(
            "doctors_alerts",
            {
                "type": "new_alert",
                "alert_type": alert_type,
                "patient_id": patient.patient_id,
                "patient_name": patient.user.get_full_name(),
                "village": patient.village,
                "district": patient.district,
                "pulse_rate": health_record.pulse_rate,
                "spo2": health_record.spo2,
                "temperature": health_record.temperature,
                "analysis_note": health_record.analysis_note,
                "alert_id": alert_id,
                "timestamp": health_record.timestamp.isoformat(),
            }
        )
    except Exception as e:
        logger.warning(f"WebSocket broadcast to doctors failed: {e}")


# ── Core pipeline — shared by upload + simulate ────────────────────────────────

def run_health_pipeline(patient, pulse_rate, spo2, temperature):
    """
    Full health processing pipeline:
    1. Analyze vitals → status + note
    2. Generate recommendations
    3. Save HealthRecord
    4. Create Alert if needed
    5. Send email alert if needed
    6. Broadcast via WebSocket
    Returns serialized response data dict.
    """
    # Step 1 & 2: Analyze + Recommend
    health_status, analysis_note = analyze_health(pulse_rate, spo2, temperature)
    recs = get_recommendations(pulse_rate, spo2, temperature, health_status)

    # Step 3: Save HealthRecord
    record = HealthRecord.objects.create(
        patient=patient,
        pulse_rate=pulse_rate,
        spo2=spo2,
        temperature=temperature,
        status=health_status,
        analysis_note=analysis_note,
        recommendations=recs,
    )

    # Step 4 & 5: Alerts + Email
    alert = None
    if health_status == 'red':
        email_sent = send_emergency_email(patient, record)
        alert = Alert.objects.create(
            patient=patient,
            health_record=record,
            alert_type='emergency',
            message=analysis_note,
            email_sent=email_sent,
        )
        # Step 6: Broadcast to patient + doctors
        broadcast_health_update(patient, record, recs)
        broadcast_doctor_alert(patient, record, 'emergency', alert.id)

    elif health_status == 'yellow':
        email_sent = send_warning_email(patient, record)
        alert = Alert.objects.create(
            patient=patient,
            health_record=record,
            alert_type='warning',
            message=analysis_note,
            email_sent=email_sent,
        )
        broadcast_health_update(patient, record, recs)
        broadcast_doctor_alert(patient, record, 'warning', alert.id)

    else:
        # Green — broadcast to patient only (no alert needed)
        broadcast_health_update(patient, record, recs)

    return {
        "record_id": record.id,
        "status": health_status,
        "analysis_note": analysis_note,
        "recommendations": recs,
        "timestamp": record.timestamp.isoformat(),
        "alert_id": alert.id if alert else None,
    }


# ── Views ──────────────────────────────────────────────────────────────────────

class HealthUploadView(APIView):
    """
    POST /api/health/upload/
    Called by ESP8266 IoT sensor (no JWT auth — uses X-Patient-ID header).
    Runs full health analysis pipeline.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Get patient from X-Patient-ID header
        patient_id = request.headers.get('X-Patient-ID')
        if not patient_id:
            return Response(
                {'error': 'X-Patient-ID header is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            patient = PatientProfile.objects.select_related('user').get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response(
                {'error': f'Patient {patient_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate required vitals
        try:
            pulse_rate  = float(request.data.get('pulse_rate'))
            spo2        = float(request.data.get('spo2'))
            temperature = float(request.data.get('temperature'))
        except (TypeError, ValueError):
            return Response(
                {'error': 'pulse_rate, spo2, and temperature must be valid numbers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = run_health_pipeline(patient, pulse_rate, spo2, temperature)
        return Response(result, status=status.HTTP_201_CREATED)


class SimulateHealthView(APIView):
    """
    POST /api/health/simulate/
    Generates predefined fake sensor readings for demo + testing without hardware.

    Body: { "patient_id": "IH-20260001", "scenario": "emergency" }
    Scenarios: "healthy" | "warning" | "emergency"
    """
    permission_classes = [IsAuthenticated]

    SCENARIOS = {
        'healthy':   {'pulse_rate': 75,  'spo2': 98,  'temperature': 98.2},
        'warning':   {'pulse_rate': 105, 'spo2': 92,  'temperature': 101.5},
        'emergency': {'pulse_rate': 135, 'spo2': 86,  'temperature': 104.2},
    }

    def post(self, request):
        patient_id = request.data.get('patient_id')
        scenario   = request.data.get('scenario', 'healthy').lower()

        if not patient_id:
            return Response({'error': 'patient_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if scenario not in self.SCENARIOS:
            return Response(
                {'error': f'Invalid scenario. Choose: {list(self.SCENARIOS.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            patient = PatientProfile.objects.select_related('user').get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': f'Patient {patient_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        vitals = self.SCENARIOS[scenario]
        result = run_health_pipeline(patient, **vitals)
        result['simulated'] = True
        result['scenario']  = scenario
        return Response(result, status=status.HTTP_201_CREATED)


class LatestHealthRecordView(APIView):
    """
    GET /api/health/latest/<patient_id>/
    Returns the most recent HealthRecord for a patient.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        try:
            patient = PatientProfile.objects.get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        record = patient.health_records.first()
        if not record:
            return Response({'message': 'No health records found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(HealthRecordSerializer(record).data)


class PatientHealthRecordsView(APIView):
    """
    GET /api/health/records/<patient_id>/
    Returns all health records for a patient. Doctor access only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        # Only doctors can view another patient's full record history
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can access full record history.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = PatientProfile.objects.get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)

        records = patient.health_records.all()
        serializer = HealthRecordSerializer(records, many=True)
        return Response({'count': records.count(), 'records': serializer.data})
