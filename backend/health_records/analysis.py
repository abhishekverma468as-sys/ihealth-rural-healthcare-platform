"""
Health Analysis Engine — iHealth
Rule-based classification of patient vitals into Green / Yellow / Red status.

Normal ranges:
  Temperature : 97.0°F – 99.0°F
  Pulse Rate  : 60 – 100 bpm
  SpO₂        : 95% – 100%
"""


def analyze_health(pulse_rate, spo2, temperature):
    """
    Classify patient vitals into a health status.

    Args:
        pulse_rate  (float): Heart rate in BPM
        spo2        (float): Blood oxygen saturation percentage
        temperature (float): Body temperature in Fahrenheit

    Returns:
        tuple: (status, analysis_note)
            status       — 'green' | 'yellow' | 'red'
            analysis_note — Human-readable explanation of findings
    """
    red_conditions = []
    yellow_conditions = []

    # ── Temperature checks ────────────────────────────────────────────────────
    if temperature > 103.0:
        red_conditions.append(f"Dangerously high fever ({temperature}°F)")
    elif temperature < 95.0:
        red_conditions.append(f"Critically low temperature ({temperature}°F)")
    elif 101.0 < temperature <= 103.0:
        yellow_conditions.append(f"High fever ({temperature}°F)")
    elif temperature < 97.0:
        yellow_conditions.append(f"Below normal temperature ({temperature}°F)")

    # ── Pulse Rate checks ─────────────────────────────────────────────────────
    if pulse_rate > 130:
        red_conditions.append(f"Critically high heart rate ({pulse_rate} bpm)")
    elif pulse_rate < 40:
        red_conditions.append(f"Critically low heart rate ({pulse_rate} bpm)")
    elif pulse_rate > 100:
        yellow_conditions.append(f"Elevated heart rate ({pulse_rate} bpm)")
    elif pulse_rate < 55:
        yellow_conditions.append(f"Low heart rate ({pulse_rate} bpm)")

    # ── SpO₂ checks ───────────────────────────────────────────────────────────
    if spo2 < 90:
        red_conditions.append(f"Critically low oxygen ({spo2}%)")
    elif spo2 < 94:
        yellow_conditions.append(f"Low oxygen ({spo2}%)")

    # ── Final classification ──────────────────────────────────────────────────
    if red_conditions:
        return 'red', "EMERGENCY: " + " | ".join(red_conditions)
    elif yellow_conditions:
        return 'yellow', "WARNING: " + " | ".join(yellow_conditions)
    else:
        return 'green', "All vitals are normal. Patient is healthy."
