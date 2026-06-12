"""
Doctors serializers — iHealth
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from doctors.models import DoctorProfile, Prescription
from patients.models import PatientProfile
from health_records.models import HealthRecord
from alerts.models import Alert


class DoctorProfileSerializer(serializers.ModelSerializer):
    """Full doctor profile."""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'doctor_id', 'name', 'email', 'phone_number',
            'specialization', 'hospital_name', 'city',
            'license_number', 'is_available', 'created_at',
        ]


class PatientListSerializer(serializers.ModelSerializer):
    """Compact patient listing for doctor's patient table."""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    last_status = serializers.SerializerMethodField()
    last_reading_time = serializers.SerializerMethodField()
    # Alias used by DoctorDashboard + PatientList components
    last_updated = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            'patient_id', 'name', 'phone_number',
            'age', 'gender', 'blood_group',
            'village', 'district', 'state',
            'last_status', 'last_reading_time', 'last_updated', 'created_at',
        ]

    def get_last_status(self, obj):
        record = obj.health_records.first()
        return record.status if record else None

    def get_last_reading_time(self, obj):
        record = obj.health_records.first()
        return record.timestamp if record else None

    def get_last_updated(self, obj):
        record = obj.health_records.first()
        return record.timestamp if record else None


class PatientDetailSerializer(serializers.ModelSerializer):
    """Full patient info + last 20 health records for doctor view."""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    recent_records = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = [
            'patient_id', 'name', 'email', 'phone_number',
            'age', 'gender', 'blood_group',
            'village', 'address', 'district', 'state', 'pincode',
            'emergency_contact', 'created_at',
            'recent_records',
        ]

    def get_recent_records(self, obj):
        from health_records.serializers import HealthRecordSerializer
        records = obj.health_records.all()[:20]
        return HealthRecordSerializer(records, many=True).data


class CreatePrescriptionSerializer(serializers.ModelSerializer):
    """Used by doctor to write a new prescription."""
    patient_id = serializers.CharField(write_only=True)

    class Meta:
        model = Prescription
        fields = ['patient_id', 'medicines', 'instructions', 'follow_up_date']

    def validate_patient_id(self, value):
        try:
            PatientProfile.objects.get(patient_id=value)
        except PatientProfile.DoesNotExist:
            raise serializers.ValidationError(f"Patient {value} not found.")
        return value

    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id')
        patient = PatientProfile.objects.get(patient_id=patient_id)
        doctor = self.context['request'].user.doctor_profile
        return Prescription.objects.create(patient=patient, doctor=doctor, **validated_data)


class PrescriptionDetailSerializer(serializers.ModelSerializer):
    """Full prescription details for doctor's view."""
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_id = serializers.CharField(source='patient.patient_id', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'patient_id', 'patient_name', 'doctor_name',
            'medicines', 'instructions', 'follow_up_date', 'created_at',
        ]
