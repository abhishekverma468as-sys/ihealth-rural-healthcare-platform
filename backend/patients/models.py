# pyrefly: ignore [missing-import]
from django.db import models
from accounts.models import CustomUser
from datetime import date


class PatientProfile(models.Model):
    """Profile model for patients registered in iHealth."""

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='patient_profile'
    )
    # Auto-generated Patient ID in format IH-YYYYXXXX (e.g. IH-20260001)
    patient_id = models.CharField(max_length=20, unique=True, blank=True)
    age = models.IntegerField()
    gender = models.CharField(choices=GENDER_CHOICES, max_length=10)
    village = models.CharField(max_length=100)
    address = models.TextField()
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    emergency_contact = models.CharField(max_length=15)
    blood_group = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Auto-generate patient_id before saving if not already set."""
        if not self.patient_id:
            year = date.today().year
            # Count existing patients this year to get the next serial
            count = PatientProfile.objects.filter(
                patient_id__startswith=f'IH-{year}'
            ).count() + 1
            self.patient_id = f'IH-{year}{count:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_id} — {self.user.get_full_name()}"
