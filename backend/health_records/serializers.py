"""
Health Records serializers — iHealth
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from health_records.models import HealthRecord


class HealthRecordSerializer(serializers.ModelSerializer):
    """Serializes a HealthRecord for API responses."""
    patient_id = serializers.CharField(source='patient.patient_id', read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)

    class Meta:
        model = HealthRecord
        fields = [
            'id', 'patient_id', 'patient_name',
            'pulse_rate', 'spo2', 'temperature',
            'status', 'analysis_note', 'recommendations',
            'timestamp',
        ]
