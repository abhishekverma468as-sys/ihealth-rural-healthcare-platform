from django.db import models


class HealthRecord(models.Model):
    """
    Stores a single health reading for a patient.
    Created each time sensor data is uploaded or simulated.
    """

    STATUS_CHOICES = [
        ('green', 'Green — Healthy'),
        ('yellow', 'Yellow — Warning'),
        ('red', 'Red — Emergency'),
    ]

    patient = models.ForeignKey(
        'patients.PatientProfile',
        on_delete=models.CASCADE,
        related_name='health_records'
    )
    # Vital signs from the IoT sensor (or simulation)
    pulse_rate = models.FloatField(help_text="Heart rate in BPM")
    spo2 = models.FloatField(help_text="Blood oxygen saturation percentage")
    temperature = models.FloatField(help_text="Body temperature in Fahrenheit")

    # Analysis output
    status = models.CharField(choices=STATUS_CHOICES, max_length=10)
    analysis_note = models.TextField(help_text="Detailed analysis from the rule engine")

    # Recommendation JSON: {diet: [], precautions: [], home_remedies: [], seek_help: bool}
    recommendations = models.JSONField(default=dict)

    # Timestamp set automatically when record is created
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Record [{self.status.upper()}] for {self.patient} at {self.timestamp}"
