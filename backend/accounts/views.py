"""
Authentication views for iHealth.

Endpoints:
  POST /api/auth/register/patient/  → PatientRegisterView
  POST /api/auth/register/doctor/   → DoctorRegisterView
  POST /api/auth/login/             → LoginView
  POST /api/auth/token/refresh/     → TokenRefreshView (simplejwt built-in)
  GET  /api/auth/me/                → MeView
  POST /api/auth/logout/            → LogoutView
"""

# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated, AllowAny
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.exceptions import TokenError

from accounts.serializers import (
    PatientRegisterSerializer,
    DoctorRegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
)


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a given user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class PatientRegisterView(APIView):
    """
    POST /api/auth/register/patient/
    Creates a new patient account and returns the auto-generated patient_id.
    No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PatientRegisterSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            tokens = get_tokens_for_user(patient.user)
            return Response({
                'message': 'Patient registered successfully.',
                'patient_id': patient.patient_id,
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'role': 'patient',
                'user_id': patient.user.id,
                'name': patient.user.get_full_name(),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorRegisterView(APIView):
    """
    POST /api/auth/register/doctor/
    Creates a new doctor account. No authentication required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DoctorRegisterSerializer(data=request.data)
        if serializer.is_valid():
            doctor = serializer.save()
            tokens = get_tokens_for_user(doctor.user)
            return Response({
                'message': 'Doctor registered successfully.',
                'doctor_id': doctor.doctor_id,
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'role': 'doctor',
                'user_id': doctor.user.id,
                'name': doctor.user.get_full_name(),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates user with email + password.
    Returns JWT tokens, role, and profile identifier.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)

            # Include profile ID (patient_id or doctor_id) for frontend routing
            profile_id = None
            if user.role == 'patient':
                try:
                    profile_id = user.patient_profile.patient_id
                except Exception:
                    pass
            elif user.role == 'doctor':
                try:
                    profile_id = user.doctor_profile.doctor_id
                except Exception:
                    pass

            return Response({
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'role': user.role,
                'user_id': user.id,
                'profile_id': profile_id,
                'name': user.get_full_name(),
                'email': user.email,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the current authenticated user's full profile.
    Requires: Bearer token in Authorization header.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the provided refresh token to invalidate the session.
    Body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
