"""
Patient API Views — iHealth

GET  /api/patients/profile/          — View own profile
PUT  /api/patients/profile/update/   — Update own profile
GET  /api/patients/dashboard/        — Latest vitals + status + recommendations
GET  /api/patients/history/          — Paginated health record history
GET  /api/patients/prescriptions/    — Prescriptions from doctors
"""

# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated

from patients.models import PatientProfile
from patients.serializers import (
    PatientProfileSerializer,
    PatientProfileUpdateSerializer,
    PrescriptionSerializer,
)
from health_records.models import HealthRecord
from health_records.serializers import HealthRecordSerializer


def get_patient_profile(user):
    """Get PatientProfile for the authenticated patient user."""
    try:
        return user.patient_profile
    except PatientProfile.DoesNotExist:
        return None


class PatientProfileView(APIView):
    """GET /api/patients/profile/ — Returns the logged-in patient's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can access this endpoint.'}, status=403)
        profile = get_patient_profile(request.user)
        if not profile:
            return Response({'error': 'Patient profile not found.'}, status=404)
        return Response(PatientProfileSerializer(profile).data)


class PatientProfileUpdateView(APIView):
    """PUT /api/patients/profile/update/ — Update the logged-in patient's profile."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can update their profile.'}, status=403)
        profile = get_patient_profile(request.user)
        if not profile:
            return Response({'error': 'Patient profile not found.'}, status=404)
        serializer = PatientProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            profile = serializer.save()
            # Return the full profile so frontend can update its state directly
            return Response(PatientProfileSerializer(profile).data)
        return Response(serializer.errors, status=400)


class PatientDashboardView(APIView):
    """
    GET /api/patients/dashboard/
    Returns latest health record + vitals + status + recommendations for the patient.
    Used to populate the patient dashboard on page load.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can access this endpoint.'}, status=403)
        profile = get_patient_profile(request.user)
        if not profile:
            return Response({'error': 'Patient profile not found.'}, status=404)

        latest = profile.health_records.first()
        if not latest:
            # Return profile but no readings yet
            return Response({
                'patient': PatientProfileSerializer(profile).data,
                'latest_record': None,
                'message': 'No health readings yet. Waiting for first sensor reading.',
            })

        return Response({
            'patient': PatientProfileSerializer(profile).data,
            'latest_record': HealthRecordSerializer(latest).data,
        })


class PatientHealthHistoryView(APIView):
    """
    GET /api/patients/history/?page=1
    Returns paginated (20 per page) health records for the logged-in patient.
    Supports ?status=green|yellow|red filter.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can access this endpoint.'}, status=403)
        profile = get_patient_profile(request.user)
        if not profile:
            return Response({'error': 'Patient profile not found.'}, status=404)

        records = profile.health_records.all()

        # Optional status filter
        status_filter = request.query_params.get('status')
        if status_filter in ('green', 'yellow', 'red'):
            records = records.filter(status=status_filter)

        # Optional date range filters
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            records = records.filter(timestamp__date__gte=date_from)
        if date_to:
            records = records.filter(timestamp__date__lte=date_to)

        # Manual pagination (20 per page)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = records.count()
        start = (page - 1) * page_size
        end = start + page_size
        page_records = records[start:end]

        return Response({
            'total': total,
            'count': total,          # alias for any frontend expecting 'count'
            'page': page,
            'total_pages': (total + page_size - 1) // page_size,
            'records': HealthRecordSerializer(page_records, many=True).data,
            'results': HealthRecordSerializer(page_records, many=True).data,  # alias
        })


class PatientPrescriptionsView(APIView):
    """
    GET /api/patients/prescriptions/
    Returns all prescriptions written for the logged-in patient.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can access this endpoint.'}, status=403)
        profile = get_patient_profile(request.user)
        if not profile:
            return Response({'error': 'Patient profile not found.'}, status=404)

        prescriptions = profile.prescriptions.select_related(
            'doctor__user'
        ).order_by('-created_at')
        return Response(PrescriptionSerializer(prescriptions, many=True).data)
