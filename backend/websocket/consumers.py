"""
Django Channels WebSocket consumers for iHealth.

PatientConsumer: Subscribes a patient to their personal vitals update group.
DoctorConsumer:  Subscribes a doctor to the shared 'doctors_alerts' group.

InMemoryChannelLayer is used — no Redis required.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class PatientConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for patient vitals feed.
    Route: ws://<host>/ws/patient/<patient_id>/
    Group: patient_<patient_id>

    Receives real-time health_update messages when sensor data is uploaded.
    """

    async def connect(self):
        self.patient_id = self.scope['url_route']['kwargs']['patient_id']
        self.group_name = f"patient_{self.patient_id}"

        # Join the patient-specific channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Confirm connection to the client
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": f"Connected to live vitals feed for {self.patient_id}",
        }))

    async def disconnect(self, close_code):
        """Leave the channel group when WebSocket disconnects."""
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Patients don't send data through WebSocket — read-only feed."""
        pass

    async def health_update(self, event):
        """
        Handler for messages of type 'health_update' sent to the patient group.
        Forwards the full event payload to the connected browser client.

        Expected payload keys:
          pulse_rate, spo2, temperature, status, analysis_note,
          recommendations, timestamp
        """
        await self.send(text_data=json.dumps(event))


class DoctorConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for doctor alerts feed.
    Route: ws://<host>/ws/doctor/<doctor_id>/
    Group: doctors_alerts  (shared — ALL doctors receive ALL alerts)

    Receives new_alert messages when any patient's status is yellow or red.
    """

    async def connect(self):
        self.doctor_id = self.scope['url_route']['kwargs']['doctor_id']
        # All doctors share a single broadcast group
        self.group_name = "doctors_alerts"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": f"Doctor {self.doctor_id} connected to alerts feed",
        }))

    async def disconnect(self, close_code):
        """Leave the shared doctors group on disconnect."""
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Doctors don't send data through WebSocket — read-only feed."""
        pass

    async def new_alert(self, event):
        """
        Handler for 'new_alert' group messages (yellow + red patient alerts).
        Forwards the alert payload to the connected doctor's browser.

        Expected payload keys:
          alert_type, patient_id, patient_name, village, district,
          pulse_rate, spo2, temperature, analysis_note, alert_id, timestamp
        """
        await self.send(text_data=json.dumps(event))

    async def health_update(self, event):
        """
        Handler for 'health_update' group messages broadcast to doctors.
        Allows doctors viewing a patient detail page to see live updates.
        """
        await self.send(text_data=json.dumps(event))
