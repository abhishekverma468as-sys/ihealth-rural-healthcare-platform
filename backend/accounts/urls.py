"""
URL routes for the accounts/auth application.

All prefixed with /api/auth/ (set in ihealth_project/urls.py)
"""

# pyrefly: ignore [missing-import]
from django.urls import path
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    PatientRegisterView,
    DoctorRegisterView,
    LoginView,
    MeView,
    LogoutView,
)

urlpatterns = [
    # Patient registration → returns patient_id + JWT tokens
    path('register/patient/', PatientRegisterView.as_view(), name='patient-register'),

    # Doctor registration → returns doctor_id + JWT tokens
    path('register/doctor/', DoctorRegisterView.as_view(), name='doctor-register'),

    # Login with email + password → returns access + refresh + role
    path('login/', LoginView.as_view(), name='login'),

    # Refresh access token using refresh token (built-in simplejwt view)
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Get current authenticated user profile
    path('me/', MeView.as_view(), name='me'),

    # Logout — blacklists refresh token
    path('logout/', LogoutView.as_view(), name='logout'),
]
