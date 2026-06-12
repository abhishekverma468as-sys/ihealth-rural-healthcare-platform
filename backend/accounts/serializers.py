"""
Serializers for iHealth authentication.

Handles user registration (patient + doctor), login, and profile retrieval.
"""

# pyrefly: ignore [missing-import]
from django.contrib.auth import authenticate
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from accounts.models import CustomUser
from patients.models import PatientProfile
from doctors.models import DoctorProfile


# ─── Patient Registration ──────────────────────────────────────────────────────

class PatientRegisterSerializer(serializers.Serializer):
    """
    Validates and creates a new patient account.
    Step 1 — Personal Details
    """
    # User account fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)

    # Patient profile fields
    age = serializers.IntegerField(min_value=0, max_value=150)
    gender = serializers.ChoiceField(choices=['Male', 'Female', 'Other'])
    blood_group = serializers.CharField(max_length=5)
    village = serializers.CharField(max_length=100)
    address = serializers.CharField()
    district = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=6, min_length=6)
    emergency_contact = serializers.CharField(max_length=15)

    def validate_email(self, value):
        """Ensure email is unique across all users."""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        """Ensure passwords match."""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """Create CustomUser with role='patient' and the linked PatientProfile."""
        # Remove non-user fields
        profile_fields = ['age', 'gender', 'blood_group', 'village', 'address',
                          'district', 'state', 'pincode', 'emergency_contact']
        profile_data = {field: validated_data.pop(field) for field in profile_fields}
        validated_data.pop('confirm_password')

        # Create the user
        user = CustomUser.objects.create_user(
            username=validated_data['email'],   # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            role='patient',
        )

        # Create the patient profile (patient_id auto-generated in save())
        patient = PatientProfile.objects.create(user=user, **profile_data)
        return patient


# ─── Doctor Registration ───────────────────────────────────────────────────────

class DoctorRegisterSerializer(serializers.Serializer):
    """Validates and creates a new doctor account with DoctorProfile."""

    # User account fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=15)

    # Doctor profile fields
    specialization = serializers.CharField(max_length=100)
    hospital_name = serializers.CharField(max_length=200)
    city = serializers.CharField(max_length=100)
    license_number = serializers.CharField(max_length=50)

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """Create CustomUser with role='doctor' and the linked DoctorProfile."""
        profile_fields = ['specialization', 'hospital_name', 'city', 'license_number']
        profile_data = {field: validated_data.pop(field) for field in profile_fields}
        validated_data.pop('confirm_password')

        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            role='doctor',
        )

        doctor = DoctorProfile.objects.create(user=user, **profile_data)
        return doctor


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    """Validates email + password credentials."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').lower()
        password = data.get('password', '')

        # Django's authenticate expects username field
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        data['user'] = user
        return data


# ─── User Profile ─────────────────────────────────────────────────────────────

class PatientProfileSerializer(serializers.ModelSerializer):
    """Serializes PatientProfile for /api/auth/me/ response."""
    class Meta:
        from patients.models import PatientProfile
        model = PatientProfile
        fields = ['patient_id', 'age', 'gender', 'blood_group', 'village',
                  'address', 'district', 'state', 'pincode', 'emergency_contact', 'created_at']


class DoctorProfileSerializer(serializers.ModelSerializer):
    """Serializes DoctorProfile for /api/auth/me/ response."""
    class Meta:
        model = DoctorProfile
        fields = ['doctor_id', 'specialization', 'hospital_name', 'city',
                  'license_number', 'is_available', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Returns the authenticated user's full profile data.
    Includes nested patient or doctor profile depending on role.
    """
    name = serializers.CharField(source='get_full_name', read_only=True)
    profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'name', 'phone_number', 'role',
                  'is_verified', 'profile']

    def get_profile(self, obj):
        """Return nested patient or doctor profile based on role."""
        if obj.role == 'patient':
            try:
                return PatientProfileSerializer(obj.patient_profile).data
            except PatientProfile.DoesNotExist:
                return None
        elif obj.role == 'doctor':
            try:
                return DoctorProfileSerializer(obj.doctor_profile).data
            except DoctorProfile.DoesNotExist:
                return None
        return None
