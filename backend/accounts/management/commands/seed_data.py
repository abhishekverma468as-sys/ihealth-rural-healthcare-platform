"""
iHealth Seed Data Management Command
=====================================
Creates realistic test data for demo and development:

  Doctors  : 2 (cardiologist + GP)
  Patients : 3 (rural Madhya Pradesh)
  Records  : 10 per patient (mix of green/yellow/red)
  Alerts   : 2 (1 emergency, 1 warning)
  Prescriptions: 2

Usage:
  python manage.py seed_data
  python manage.py seed_data --clear   ← wipe all data first
"""

# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
# pyrefly: ignore [missing-import]
from django.utils import timezone
from datetime import timedelta
import random

from accounts.models import CustomUser
from patients.models import PatientProfile
from doctors.models import DoctorProfile, Prescription
from health_records.models import HealthRecord
from health_records.analysis import analyze_health
from health_records.recommendations import get_recommendations
from alerts.models import Alert


# ─── Test account credentials ─────────────────────────────────────────────────
DOCTOR_PASSWORD  = 'Doctor@123'
PATIENT_PASSWORD = 'Patient@123'


class Command(BaseCommand):
    help = 'Seeds the database with realistic iHealth test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing iHealth data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑️  Clearing existing data...')
            Alert.objects.all().delete()
            Prescription.objects.all().delete()
            HealthRecord.objects.all().delete()
            PatientProfile.objects.all().delete()
            DoctorProfile.objects.all().delete()
            CustomUser.objects.filter(role__in=['patient', 'doctor']).delete()
            self.stdout.write(self.style.WARNING('   Existing data cleared.\n'))

        self.stdout.write(self.style.MIGRATE_HEADING('🌱 iHealth Seed Data\n' + '='*50))

        doctors  = self._create_doctors()
        patients = self._create_patients()
        records  = self._create_health_records(patients)
        self._create_alerts(patients, records)
        self._create_prescriptions(patients, doctors, records)

        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ Seed data created successfully!\n'))
        self.stdout.write('📋 Test Credentials:')
        self.stdout.write(f'   Doctor  : anil@doctor.com  / {DOCTOR_PASSWORD}')
        self.stdout.write(f'   Doctor  : priya@doctor.com / {DOCTOR_PASSWORD}')
        self.stdout.write(f'   Patient : ramesh@patient.com / {PATIENT_PASSWORD}')
        self.stdout.write(f'   Patient : geeta@patient.com  / {PATIENT_PASSWORD}')
        self.stdout.write(f'   Patient : suresh@patient.com / {PATIENT_PASSWORD}')

    # ── Doctors ────────────────────────────────────────────────────────────────

    def _create_doctors(self):
        self.stdout.write('\n👨‍⚕️  Creating doctors...')
        doctors = []

        doctor_data = [
            {
                'email': 'anil@doctor.com',
                'first_name': 'Anil',
                'last_name': 'Sharma',
                'phone_number': '9876500001',
                'specialization': 'Cardiologist',
                'hospital_name': 'City Hospital Indore',
                'city': 'Indore',
                'license_number': 'MCI-2018-IND-4521',
            },
            {
                'email': 'priya@doctor.com',
                'first_name': 'Priya',
                'last_name': 'Verma',
                'phone_number': '9876500002',
                'specialization': 'General Physician',
                'hospital_name': 'District Hospital Bhopal',
                'city': 'Bhopal',
                'license_number': 'MCI-2020-BPL-7832',
            },
        ]

        for d in doctor_data:
            # Skip if already exists
            if CustomUser.objects.filter(email=d['email']).exists():
                user = CustomUser.objects.get(email=d['email'])
                doctor = user.doctor_profile
                self.stdout.write(f'   ⚠️  Dr. {d["first_name"]} {d["last_name"]} already exists — skipping.')
                doctors.append(doctor)
                continue

            user = CustomUser.objects.create_user(
                username=d['email'],
                email=d['email'],
                password=DOCTOR_PASSWORD,
                first_name=d['first_name'],
                last_name=d['last_name'],
                phone_number=d['phone_number'],
                role='doctor',
                is_verified=True,
            )
            doctor = DoctorProfile.objects.create(
                user=user,
                specialization=d['specialization'],
                hospital_name=d['hospital_name'],
                city=d['city'],
                license_number=d['license_number'],
                is_available=True,
            )
            doctors.append(doctor)
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ Dr. {d["first_name"]} {d["last_name"]} ({doctor.doctor_id})')
            )

        return doctors

    # ── Patients ───────────────────────────────────────────────────────────────

    def _create_patients(self):
        self.stdout.write('\n🧑‍🤝‍🧑 Creating patients...')
        patients = []

        patient_data = [
            {
                'email': 'ramesh@patient.com',
                'first_name': 'Ramesh',
                'last_name': 'Kumar',
                'phone_number': '9812300001',
                'age': 45,
                'gender': 'Male',
                'blood_group': 'O+',
                'village': 'Sanwer',
                'address': 'Gram Panchayat Sanwer, Near Primary School',
                'district': 'Indore',
                'state': 'Madhya Pradesh',
                'pincode': '453551',
                'emergency_contact': '9812300099',
            },
            {
                'email': 'geeta@patient.com',
                'first_name': 'Geeta',
                'last_name': 'Devi',
                'phone_number': '9812300002',
                'age': 38,
                'gender': 'Female',
                'blood_group': 'B+',
                'village': 'Betma',
                'address': 'Ward No. 5, Betma, Near Hanuman Mandir',
                'district': 'Indore',
                'state': 'Madhya Pradesh',
                'pincode': '453660',
                'emergency_contact': '9812300098',
            },
            {
                'email': 'suresh@patient.com',
                'first_name': 'Suresh',
                'last_name': 'Patel',
                'phone_number': '9812300003',
                'age': 52,
                'gender': 'Male',
                'blood_group': 'A+',
                'village': 'Mhow',
                'address': 'Gandhi Nagar Colony, Mhow Cantonment',
                'district': 'Indore',
                'state': 'Madhya Pradesh',
                'pincode': '453441',
                'emergency_contact': '9812300097',
            },
        ]

        for p in patient_data:
            if CustomUser.objects.filter(email=p['email']).exists():
                user = CustomUser.objects.get(email=p['email'])
                patient = user.patient_profile
                self.stdout.write(f'   ⚠️  {p["first_name"]} {p["last_name"]} already exists — skipping.')
                patients.append(patient)
                continue

            user = CustomUser.objects.create_user(
                username=p['email'],
                email=p['email'],
                password=PATIENT_PASSWORD,
                first_name=p['first_name'],
                last_name=p['last_name'],
                phone_number=p['phone_number'],
                role='patient',
                is_verified=True,
            )
            patient = PatientProfile.objects.create(
                user=user,
                age=p['age'],
                gender=p['gender'],
                blood_group=p['blood_group'],
                village=p['village'],
                address=p['address'],
                district=p['district'],
                state=p['state'],
                pincode=p['pincode'],
                emergency_contact=p['emergency_contact'],
            )
            patients.append(patient)
            self.stdout.write(
                self.style.SUCCESS(f'   ✅ {p["first_name"]} {p["last_name"]} ({patient.patient_id})')
            )

        return patients

    # ── Health Records ─────────────────────────────────────────────────────────

    def _create_health_records(self, patients):
        """
        Creates 10 health records per patient over the last 7 days.
        Distribution: 6 green, 3 yellow, 1 red per patient.
        """
        self.stdout.write('\n📊 Creating health records (10 per patient)...')

        # Pre-defined vitals for each status
        vitals_pool = {
            'green': [
                (72, 98, 98.2), (75, 99, 98.6), (68, 97, 98.4),
                (80, 98, 98.8), (70, 99, 97.8), (76, 98, 98.0),
            ],
            'yellow': [
                (105, 92, 101.5), (108, 93, 102.0), (58, 93, 101.8),
            ],
            'red': [
                (138, 86, 104.5),
            ],
        }

        all_records = {}
        now = timezone.now()

        for patient in patients:
            records = []
            # Build sequence: spread over 7 days, newest first
            sequence = (
                ['red']    * 1 +
                ['yellow'] * 3 +
                ['green']  * 6
            )
            random.shuffle(sequence)

            for i, target_status in enumerate(sequence):
                # Spread timestamps: reading every ~16 hours over 7 days
                timestamp = now - timedelta(hours=i * 16 + random.randint(0, 4))
                vitals = random.choice(vitals_pool[target_status])
                pulse_rate, spo2, temperature = vitals

                status, note = analyze_health(pulse_rate, spo2, temperature)
                recs = get_recommendations(pulse_rate, spo2, temperature, status)

                record = HealthRecord(
                    patient=patient,
                    pulse_rate=pulse_rate,
                    spo2=spo2,
                    temperature=temperature,
                    status=status,
                    analysis_note=note,
                    recommendations=recs,
                )
                # Bypass auto_now_add to set custom timestamp
                record.save()
                HealthRecord.objects.filter(pk=record.pk).update(timestamp=timestamp)
                record.refresh_from_db()
                records.append(record)

            all_records[patient.patient_id] = records
            self.stdout.write(
                self.style.SUCCESS(
                    f'   ✅ {patient.user.get_full_name()} — '
                    f'{sum(1 for r in records if r.status=="green")} green, '
                    f'{sum(1 for r in records if r.status=="yellow")} yellow, '
                    f'{sum(1 for r in records if r.status=="red")} red'
                )
            )

        return all_records

    # ── Alerts ─────────────────────────────────────────────────────────────────

    def _create_alerts(self, patients, records_map):
        """Creates 1 emergency alert and 1 warning alert."""
        self.stdout.write('\n🚨 Creating alerts...')

        # Emergency alert for patient 1 (Ramesh Kumar)
        p1 = patients[0]
        red_record = next(
            (r for r in records_map[p1.patient_id] if r.status == 'red'),
            records_map[p1.patient_id][0]
        )
        alert1 = Alert.objects.create(
            patient=p1,
            health_record=red_record,
            alert_type='emergency',
            message=red_record.analysis_note,
            is_resolved=False,
            email_sent=False,
        )
        self.stdout.write(self.style.SUCCESS(
            f'   ✅ Emergency alert #{alert1.id} — {p1.user.get_full_name()} (unresolved)'
        ))

        # Warning alert for patient 2 (Geeta Devi) — already resolved
        p2 = patients[1]
        yellow_record = next(
            (r for r in records_map[p2.patient_id] if r.status == 'yellow'),
            records_map[p2.patient_id][0]
        )
        alert2 = Alert.objects.create(
            patient=p2,
            health_record=yellow_record,
            alert_type='warning',
            message=yellow_record.analysis_note,
            is_resolved=True,
            email_sent=False,
        )
        self.stdout.write(self.style.SUCCESS(
            f'   ✅ Warning alert #{alert2.id} — {p2.user.get_full_name()} (resolved)'
        ))

    # ── Prescriptions ──────────────────────────────────────────────────────────

    def _create_prescriptions(self, patients, doctors, records_map):
        """Creates 2 prescriptions from doctors to patients."""
        self.stdout.write('\n💊 Creating prescriptions...')

        if not doctors:
            self.stdout.write(self.style.WARNING('   No doctors found — skipping prescriptions.'))
            return

        # Prescription 1: Dr. Anil Sharma → Ramesh Kumar
        p1 = patients[0]
        d1 = doctors[0]
        rx1 = Prescription.objects.create(
            patient=p1,
            doctor=d1,
            medicines=(
                '1. Tab. Paracetamol 500mg — 1 tablet three times daily after food\n'
                '2. Tab. Cetirizine 10mg — 1 tablet at night\n'
                '3. Syp. Benadryl 10ml — twice daily\n'
                '4. ORS sachets — 1 sachet in 1 litre water, sip throughout the day'
            ),
            instructions=(
                'Take complete bed rest for 3 days.\n'
                'Drink at least 3 litres of water daily.\n'
                'Eat light food — khichdi, dal, rice. Avoid oily and spicy food.\n'
                'If fever exceeds 103°F or breathing difficulty, go to nearest hospital immediately.\n'
                'Come for follow-up after 5 days.'
            ),
            follow_up_date=(timezone.now() + timedelta(days=5)).date(),
        )
        self.stdout.write(self.style.SUCCESS(
            f'   ✅ Rx #{rx1.id}: Dr. {d1.user.get_full_name()} → {p1.user.get_full_name()}'
        ))

        # Prescription 2: Dr. Priya Verma → Geeta Devi
        if len(patients) > 1 and len(doctors) > 1:
            p2 = patients[1]
            d2 = doctors[1]
            rx2 = Prescription.objects.create(
                patient=p2,
                doctor=d2,
                medicines=(
                    '1. Tab. Azithromycin 500mg — 1 tablet daily for 5 days\n'
                    '2. Tab. Pantoprazole 40mg — 1 tablet before breakfast\n'
                    '3. Syp. Glycodin Terp Vasaka 5ml — three times daily\n'
                    '4. Steam inhalation with Karvol Plus — twice daily'
                ),
                instructions=(
                    'Rest adequately. Avoid cold water and cold environment.\n'
                    'Have warm liquids — ginger tea, turmeric milk.\n'
                    'Do not skip medicines. Complete the 5-day antibiotic course.\n'
                    'If SpO₂ drops below 94%, visit the health centre immediately.\n'
                    'Follow-up in 7 days.'
                ),
                follow_up_date=(timezone.now() + timedelta(days=7)).date(),
            )
            self.stdout.write(self.style.SUCCESS(
                f'   ✅ Rx #{rx2.id}: Dr. {d2.user.get_full_name()} → {p2.user.get_full_name()}'
            ))
