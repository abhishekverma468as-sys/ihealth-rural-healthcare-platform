from django.db import models


class Alert(models.Model):
    """
    Alert created when a patient's health status is yellow or red.
    Tracks whether the alert has been resolved by a doctor.
    """

    ALERT_TYPE_CHOICES = [
        ('emergency', 'Emergency'),
        ('warning', 'Warning'),
    ]

    patient = models.ForeignKey(
        'patients.PatientProfile',
        on_delete=models.CASCADE,
        related_name='alerts'
    )
    health_record = models.ForeignKey(
        'health_records.HealthRecord',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts'
    )
    alert_type = models.CharField(choices=ALERT_TYPE_CHOICES, max_length=15)
    message = models.TextField()

    # Resolution tracking
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        'doctors.DoctorProfile',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='resolved_alerts'
    )

    # Tracks if email alert was sent successfully via Gmail SMTP
    email_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "✅ Resolved" if self.is_resolved else "🚨 Active"
        return f"[{self.alert_type.upper()}] {self.patient} — {status}"
