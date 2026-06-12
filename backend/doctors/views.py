"""
Doctor API Views — iHealth

GET  /api/doctors/patients/              — All patients list
GET  /api/doctors/patients/<id>/         — Patient detail + history
GET  /api/doctors/alerts/                — All alerts
GET  /api/doctors/alerts/emergency/      — Unresolved emergency alerts
PUT  /api/doctors/alerts/<id>/resolve/   — Mark alert as resolved
POST /api/doctors/prescriptions/         — Write a new prescription
GET  /api/doctors/prescriptions/         — Doctor's own prescriptions
GET  /api/doctors/dashboard/             — Dashboard stats
"""

from datetime import date
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated

from patients.models import PatientProfile
from alerts.models import Alert
from alerts.serializers import AlertSerializer
from doctors.models import DoctorProfile, Prescription
from doctors.serializers import (
    PatientListSerializer,
    PatientDetailSerializer,
    CreatePrescriptionSerializer,
    PrescriptionDetailSerializer,
)


def get_doctor_profile(user):
    """Get DoctorProfile for the authenticated doctor user."""
    try:
        return user.doctor_profile
    except DoctorProfile.DoesNotExist:
        return None


def doctor_only(request):
    """Returns error response if user is not a doctor."""
    if request.user.role != 'doctor':
        return Response({'error': 'Only doctors can access this endpoint.'}, status=403)
    return None


class DoctorPatientsListView(APIView):
    """GET /api/doctors/patients/ — Full list of all registered patients."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = doctor_only(request)
        if err: return err

        patients = PatientProfile.objects.select_related('user').all().order_by('-created_at')

        # Search by name or patient_id
        search = request.query_params.get('search', '').strip()
        if search:
            patients = patients.filter(
                patient_id__icontains=search
            ) | patients.filter(
                user__first_name__icontains=search
            ) | patients.filter(
                user__last_name__icontains=search
            )

        # Status filter: pass ?status=red to filter by last reading status
        status_filter = request.query_params.get('status')
        if status_filter in ('green', 'yellow', 'red'):
            # Filter patients whose latest health record has matching status
            from health_records.models import HealthRecord
            matching_ids = []
            for p in patients:
                last = p.health_records.first()
                if last and last.status == status_filter:
                    matching_ids.append(p.patient_id)
            patients = patients.filter(patient_id__in=matching_ids)

        return Response(PatientListSerializer(patients, many=True).data)


class DoctorPatientDetailView(APIView):
    """GET /api/doctors/patients/<patient_id>/ — Full patient info + last 20 records."""
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        err = doctor_only(request)
        if err: return err

        try:
            patient = PatientProfile.objects.select_related('user').get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        return Response(PatientDetailSerializer(patient).data)


class DoctorAlertsView(APIView):
    """GET /api/doctors/alerts/ — All alerts ordered by newest first."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = doctor_only(request)
        if err: return err

        alerts = Alert.objects.select_related(
            'patient__user', 'health_record', 'resolved_by__user'
        ).all()

        # Filter by alert_type if provided
        alert_type = request.query_params.get('type')
        if alert_type in ('emergency', 'warning'):
            alerts = alerts.filter(alert_type=alert_type)

        return Response(AlertSerializer(alerts, many=True).data)


class DoctorEmergencyAlertsView(APIView):
    """GET /api/doctors/alerts/emergency/ — Unresolved emergency alerts only."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = doctor_only(request)
        if err: return err

        alerts = Alert.objects.filter(
            alert_type='emergency',
            is_resolved=False
        ).select_related('patient__user', 'health_record')

        return Response(AlertSerializer(alerts, many=True).data)


class ResolveAlertView(APIView):
    """PUT /api/doctors/alerts/<id>/resolve/ — Mark an alert as resolved."""
    permission_classes = [IsAuthenticated]

    def put(self, request, alert_id):
        err = doctor_only(request)
        if err: return err

        try:
            alert = Alert.objects.get(id=alert_id)
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=404)

        if alert.is_resolved:
            return Response({'message': 'Alert already resolved.'})

        doctor = get_doctor_profile(request.user)
        alert.is_resolved = True
        alert.resolved_by = doctor
        alert.save()

        return Response({
            'message': 'Alert resolved successfully.',
            'alert_id': alert.id,
            'resolved_by': f"Dr. {request.user.get_full_name()}",
        })


class DoctorPrescriptionsView(APIView):
    """
    GET  /api/doctors/prescriptions/ — All prescriptions written by this doctor.
    POST /api/doctors/prescriptions/ — Create a new prescription.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = doctor_only(request)
        if err: return err

        doctor = get_doctor_profile(request.user)
        if not doctor:
            return Response({'error': 'Doctor profile not found.'}, status=404)

        prescriptions = Prescription.objects.filter(
            doctor=doctor
        ).select_related('patient__user').order_by('-created_at')

        return Response(PrescriptionDetailSerializer(prescriptions, many=True).data)

    def post(self, request):
        err = doctor_only(request)
        if err: return err

        serializer = CreatePrescriptionSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            prescription = serializer.save()
            # Return full details so frontend can update list immediately
            return Response(
                PrescriptionDetailSerializer(prescription).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=400)


class DoctorDashboardView(APIView):
    """
    GET /api/doctors/dashboard/
    Returns aggregated stats for the doctor's dashboard header cards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        err = doctor_only(request)
        if err: return err

        today = date.today()

        total_patients = PatientProfile.objects.count()
        active_emergencies = Alert.objects.filter(
            alert_type='emergency', is_resolved=False
        ).count()
        resolved_today = Alert.objects.filter(
            is_resolved=True,
            created_at__date=today
        ).count()
        pending_warnings = Alert.objects.filter(
            alert_type='warning', is_resolved=False
        ).count()

        return Response({
            'total_patients': total_patients,
            'active_emergencies': active_emergencies,
            'resolved_today': resolved_today,
            'pending_reviews': pending_warnings,
        })


class DoctorPatientRecordsView(APIView):
    """
    GET /api/doctors/patients/<patient_id>/records/
    All health records for a specific patient (doctor access only).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        err = doctor_only(request)
        if err: return err

        try:
            patient = PatientProfile.objects.get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        from health_records.models import HealthRecord
        from health_records.serializers import HealthRecordSerializer
        records = patient.health_records.all()
        return Response({'count': records.count(), 'results': HealthRecordSerializer(records, many=True).data})


class DoctorPatientAlertsView(APIView):
    """
    GET /api/doctors/patients/<patient_id>/alerts/
    All alerts for a specific patient.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        err = doctor_only(request)
        if err: return err

        try:
            patient = PatientProfile.objects.get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        alerts = Alert.objects.filter(patient=patient).select_related(
            'patient__user', 'health_record', 'resolved_by__user'
        )
        return Response({'count': alerts.count(), 'results': AlertSerializer(alerts, many=True).data})


class DoctorPatientPrescriptionsView(APIView):
    """
    GET /api/doctors/patients/<patient_id>/prescriptions/
    All prescriptions written for a specific patient.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        err = doctor_only(request)
        if err: return err

        try:
            patient = PatientProfile.objects.get(patient_id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)

        prescriptions = Prescription.objects.filter(patient=patient).select_related(
            'doctor__user', 'patient__user'
        ).order_by('-created_at')
        return Response(PrescriptionDetailSerializer(prescriptions, many=True).data)
