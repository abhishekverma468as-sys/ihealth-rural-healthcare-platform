"""
Gmail SMTP Email Alert System — iHealth
Sends HTML emergency and warning emails to available doctors.
Uses Python built-in smtplib — 100% free, no third-party service needed.

Setup: Add GMAIL_USER and GMAIL_APP_PASSWORD to backend/.env
Guide: myaccount.google.com → Security → App Passwords
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
# pyrefly: ignore [missing-import]
from django.conf import settings
from doctors.models import DoctorProfile

logger = logging.getLogger(__name__)


def _send_email(subject: str, html_body: str, recipients: list[str]):
    """
    Internal helper: sends an HTML email via Gmail SMTP SSL.
    Wraps smtplib so callers don't need to handle SMTP setup.
    """
    gmail_user = settings.GMAIL_USER
    gmail_password = settings.GMAIL_APP_PASSWORD

    if not gmail_user or not gmail_password:
        logger.warning("Gmail credentials not configured — skipping email alert.")
        return False

    if not recipients:
        logger.warning("No recipients found — skipping email alert.")
        return False

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            for recipient in recipients:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = f"iHealth Alert System <{gmail_user}>"
                msg['To'] = recipient
                msg.attach(MIMEText(html_body, 'html'))
                server.sendmail(gmail_user, recipient, msg.as_string())
                logger.info(f"Email sent to {recipient}")
        return True
    except Exception as e:
        # Log but never crash the request — email is non-critical
        logger.error(f"Failed to send email alert: {e}")
        return False


def send_emergency_email(patient, health_record) -> bool:
    """
    Send a RED EMERGENCY alert email to ALL available doctors.

    Args:
        patient       : PatientProfile instance
        health_record : HealthRecord instance

    Returns:
        bool: True if at least one email was sent successfully
    """
    available_doctors = DoctorProfile.objects.filter(
        is_available=True
    ).select_related('user')

    recipients = [
        doc.user.email for doc in available_doctors if doc.user.email
    ]

    subject = f"🚨 EMERGENCY ALERT — Patient {patient.patient_id} Needs Immediate Help"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background-color:#fff0f0;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:20px auto;background:#fff;border-left:8px solid #DC2626;
                  border-radius:8px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <div style="background:#DC2626;color:#fff;padding:16px 20px;border-radius:6px;margin-bottom:24px;">
          <h2 style="margin:0;font-size:22px;">🚨 EMERGENCY HEALTH ALERT — iHealth System</h2>
          <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Immediate medical attention required</p>
        </div>

        <h3 style="color:#DC2626;border-bottom:2px solid #fecaca;padding-bottom:8px;">Patient Information</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px;color:#666;width:40%"><b>Patient Name</b></td>
              <td style="padding:8px;">{patient.user.get_full_name()}</td></tr>
          <tr style="background:#fff5f5;"><td style="padding:8px;color:#666"><b>Patient ID</b></td>
              <td style="padding:8px;font-weight:bold;color:#DC2626;">{patient.patient_id}</td></tr>
          <tr><td style="padding:8px;color:#666"><b>Village / District</b></td>
              <td style="padding:8px;">{patient.village}, {patient.district}</td></tr>
          <tr style="background:#fff5f5;"><td style="padding:8px;color:#666"><b>State</b></td>
              <td style="padding:8px;">{patient.state}</td></tr>
          <tr><td style="padding:8px;color:#666"><b>Mobile</b></td>
              <td style="padding:8px;">{patient.user.phone_number}</td></tr>
          <tr style="background:#fff5f5;"><td style="padding:8px;color:#666"><b>Emergency Contact</b></td>
              <td style="padding:8px;font-weight:bold;">{patient.emergency_contact}</td></tr>
          <tr><td style="padding:8px;color:#666"><b>Blood Group</b></td>
              <td style="padding:8px;">{patient.blood_group}</td></tr>
        </table>

        <h3 style="color:#DC2626;border-bottom:2px solid #fecaca;padding-bottom:8px;">Critical Vitals</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr style="background:#fff5f5;">
            <td style="padding:12px;font-size:18px;">❤️</td>
            <td style="padding:12px;color:#666;">Heart Rate</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#DC2626;">
              {health_record.pulse_rate} BPM</td>
          </tr>
          <tr>
            <td style="padding:12px;font-size:18px;">🫁</td>
            <td style="padding:12px;color:#666;">SpO₂ (Oxygen)</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#DC2626;">
              {health_record.spo2}%</td>
          </tr>
          <tr style="background:#fff5f5;">
            <td style="padding:12px;font-size:18px;">🌡️</td>
            <td style="padding:12px;color:#666;">Temperature</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#DC2626;">
              {health_record.temperature}°F</td>
          </tr>
        </table>

        <div style="background:#DC2626;color:#fff;padding:16px;border-radius:6px;margin-bottom:20px;">
          <strong>Analysis:</strong> {health_record.analysis_note}
        </div>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:6px;">
          <p style="margin:0;color:#374151;">
            Please login to the <strong>iHealth Doctor Dashboard</strong> immediately and attend to this patient.
            Contact the patient or their emergency contact without delay.
          </p>
        </div>

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
          This is an automated alert from the iHealth IoT Rural Health Monitoring System.<br>
          Alert generated at: {health_record.timestamp.strftime('%d %b %Y, %I:%M %p IST')}
        </p>
      </div>
    </body>
    </html>
    """

    return _send_email(subject, html_body, recipients)


def send_warning_email(patient, health_record) -> bool:
    """
    Send a YELLOW WARNING alert email to available doctors.
    Less urgent styling than emergency — amber/orange theme.

    Args:
        patient       : PatientProfile instance
        health_record : HealthRecord instance

    Returns:
        bool: True if email was sent successfully
    """
    available_doctors = DoctorProfile.objects.filter(
        is_available=True
    ).select_related('user')

    recipients = [
        doc.user.email for doc in available_doctors if doc.user.email
    ]

    subject = f"⚠️ Health Warning — Patient {patient.patient_id} Needs Attention"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background-color:#fffbeb;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:20px auto;background:#fff;border-left:8px solid #D97706;
                  border-radius:8px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <div style="background:#D97706;color:#fff;padding:16px 20px;border-radius:6px;margin-bottom:24px;">
          <h2 style="margin:0;font-size:22px;">⚠️ HEALTH WARNING — iHealth System</h2>
          <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Patient vitals require your attention</p>
        </div>

        <h3 style="color:#D97706;border-bottom:2px solid #fde68a;padding-bottom:8px;">Patient Information</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px;color:#666;width:40%"><b>Patient Name</b></td>
              <td style="padding:8px;">{patient.user.get_full_name()}</td></tr>
          <tr style="background:#fffbeb;"><td style="padding:8px;color:#666"><b>Patient ID</b></td>
              <td style="padding:8px;font-weight:bold;color:#D97706;">{patient.patient_id}</td></tr>
          <tr><td style="padding:8px;color:#666"><b>Village / District</b></td>
              <td style="padding:8px;">{patient.village}, {patient.district}</td></tr>
          <tr style="background:#fffbeb;"><td style="padding:8px;color:#666"><b>Mobile</b></td>
              <td style="padding:8px;">{patient.user.phone_number}</td></tr>
          <tr><td style="padding:8px;color:#666"><b>Emergency Contact</b></td>
              <td style="padding:8px;">{patient.emergency_contact}</td></tr>
        </table>

        <h3 style="color:#D97706;border-bottom:2px solid #fde68a;padding-bottom:8px;">Vitals Reading</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr style="background:#fffbeb;">
            <td style="padding:12px;font-size:18px;">❤️</td>
            <td style="padding:12px;color:#666;">Heart Rate</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#D97706;">
              {health_record.pulse_rate} BPM</td>
          </tr>
          <tr>
            <td style="padding:12px;font-size:18px;">🫁</td>
            <td style="padding:12px;color:#666;">SpO₂ (Oxygen)</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#D97706;">
              {health_record.spo2}%</td>
          </tr>
          <tr style="background:#fffbeb;">
            <td style="padding:12px;font-size:18px;">🌡️</td>
            <td style="padding:12px;color:#666;">Temperature</td>
            <td style="padding:12px;font-weight:bold;font-size:18px;color:#D97706;">
              {health_record.temperature}°F</td>
          </tr>
        </table>

        <div style="background:#D97706;color:#fff;padding:16px;border-radius:6px;margin-bottom:20px;">
          <strong>Analysis:</strong> {health_record.analysis_note}
        </div>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:6px;">
          <p style="margin:0;color:#374151;">
            Please review this patient's vitals on the <strong>iHealth Doctor Dashboard</strong>
            and consider reaching out if needed.
          </p>
        </div>

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
          Automated warning from iHealth IoT Rural Health Monitoring System.<br>
          Alert generated at: {health_record.timestamp.strftime('%d %b %Y, %I:%M %p IST')}
        </p>
      </div>
    </body>
    </html>
    """

    return _send_email(subject, html_body, recipients)
