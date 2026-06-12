"""
Alerts serializer — iHealth
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from alerts.models import Alert


class AlertSerializer(serializers.ModelSerializer):
    """Serializes Alert objects with patient and resolver details."""
    patient_id = serializers.CharField(source='patient.patient_id', read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    # Duplicate as both 'village' (matches WS payload) and 'patient_village'
    village = serializers.CharField(source='patient.village', read_only=True)
    district = serializers.CharField(source='patient.district', read_only=True)
    patient_village = serializers.CharField(source='patient.village', read_only=True)
    patient_phone = serializers.CharField(source='patient.user.phone_number', read_only=True)
    resolved_by_name = serializers.SerializerMethodField()

    # Latest vitals from the linked health record
    pulse_rate = serializers.FloatField(source='health_record.pulse_rate', read_only=True)
    spo2 = serializers.FloatField(source='health_record.spo2', read_only=True)
    temperature = serializers.FloatField(source='health_record.temperature', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'patient_id', 'patient_name',
            'village', 'district', 'patient_village', 'patient_phone',
            'alert_type', 'message', 'is_resolved', 'resolved_by_name',
            'email_sent', 'created_at',
            'pulse_rate', 'spo2', 'temperature',
        ]

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"Dr. {obj.resolved_by.user.get_full_name()}"
        return None
