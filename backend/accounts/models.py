# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
    ]
    role = models.CharField(choices=ROLE_CHOICES, max_length=10)
    phone_number = models.CharField(max_length=15)
    is_verified = models.BooleanField(default=False)
