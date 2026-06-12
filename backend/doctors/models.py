from django.db import models
from accounts.models import CustomUser
from datetime import date


class DoctorProfile(models.Model):
    """Profile model for doctors registered in iHealth."""

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='doctor_profile'
    )
    # Auto-generated Doctor ID in format DR-YYYYXXXX
    doctor_id = models.CharField(max_length=20, unique=True, blank=True)
    specialization = models.CharField(max_length=100)
    hospital_name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)
    # is_available controls whether this doctor receives email alerts
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Auto-generate doctor_id before saving if not already set."""
        if not self.doctor_id:
            year = date.today().year
            count = DoctorProfile.objects.filter(
                doctor_id__startswith=f'DR-{year}'
            ).count() + 1
            self.doctor_id = f'DR-{year}{count:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.doctor_id} — Dr. {self.user.get_full_name()}"


class Prescription(models.Model):
    """Prescription written by a doctor for a patient."""

    # Importing here to avoid circular imports at module level
    patient = models.ForeignKey(
        'patients.PatientProfile', on_delete=models.CASCADE, related_name='prescriptions'
    )
    doctor = models.ForeignKey(
        DoctorProfile, on_delete=models.CASCADE, related_name='prescriptions'
    )
    health_record = models.ForeignKey(
        'health_records.HealthRecord',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='prescriptions'
    )
    medicines = models.TextField(help_text="List of medicines and dosages")
    instructions = models.TextField(help_text="Usage instructions for the patient")
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rx by {self.doctor} for {self.patient} on {self.created_at.date()}"
