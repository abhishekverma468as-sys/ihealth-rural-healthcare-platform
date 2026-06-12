"""
Patients serializers — iHealth
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from patients.models import PatientProfile
from health_records.models import HealthRecord
from doctors.models import Prescription


class PatientProfileSerializer(serializers.ModelSerializer):
    """Full patient profile serializer."""
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'patient_id', 'first_name', 'last_name', 'name', 'email', 'phone_number',
            'age', 'gender', 'blood_group',
            'village', 'address', 'district', 'state', 'pincode',
            'emergency_contact', 'created_at',
        ]
        read_only_fields = ['patient_id', 'created_at']


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows patient to update their profile fields."""
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    phone_number = serializers.CharField(source='user.phone_number')

    class Meta:
        model = PatientProfile
        fields = [
            'first_name', 'last_name', 'phone_number',
            'age', 'gender', 'blood_group',
            'village', 'address', 'district', 'state', 'pincode',
            'emergency_contact',
        ]

    def update(self, instance, validated_data):
        # Update nested user fields
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PrescriptionSerializer(serializers.ModelSerializer):
    """Serializes Prescription for patient view."""
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'doctor_name', 'doctor_specialization',
            'medicines', 'instructions', 'follow_up_date', 'created_at',
        ]
