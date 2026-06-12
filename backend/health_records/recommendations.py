"""
Recommendation Engine — iHealth
Generates personalised diet, precaution, and home remedy advice
based on a patient's vital readings and health status.

Advice is tailored for rural Indian patients with locally available remedies.
"""


def get_recommendations(pulse_rate, spo2, temperature, status):
    """
    Generate actionable health recommendations for a patient.

    Args:
        pulse_rate  (float): Heart rate in BPM
        spo2        (float): Blood oxygen saturation percentage
        temperature (float): Body temperature in Fahrenheit
        status      (str)  : 'green' | 'yellow' | 'red'

    Returns:
        dict: {
            "diet"         : list[str],
            "precautions"  : list[str],
            "home_remedies": list[str],
            "seek_help"    : bool   — True if patient must contact a doctor/hospital
        }
    """
    diet = []
    precautions = []
    home_remedies = []
    seek_help = False

    # ── Critical vitals — immediate medical attention required ────────────────
    if temperature > 103.0 or spo2 < 90 or pulse_rate > 130 or pulse_rate < 40:
        seek_help = True
        precautions += [
            "Contact nearest hospital immediately",
            "Do not leave patient alone",
        ]

    # ── High fever advice ─────────────────────────────────────────────────────
    if temperature > 101.0:
        diet += [
            "Drink plenty of water and coconut water",
            "Eat light food like khichdi and dal rice",
        ]
        home_remedies += [
            "Place cool damp cloth on forehead",
            "Tulsi ginger tea with honey",
            "Lukewarm water bath",
        ]
        precautions += [
            "Rest in well-ventilated cool room",
            "Avoid cold drinks and oily food",
        ]

    # ── Low oxygen saturation advice ──────────────────────────────────────────
    if spo2 < 94:
        precautions += [
            "Sit upright or keep head elevated",
            "Practice slow deep breathing",
            "Open all windows for fresh air",
        ]
        home_remedies += [
            "Steam inhalation with eucalyptus oil",
        ]
        seek_help = True

    # ── High pulse rate (tachycardia) advice ──────────────────────────────────
    if pulse_rate > 100:
        precautions += [
            "Sit or lie down immediately",
            "Avoid any physical exertion",
            "Avoid caffeine and spicy food",
        ]
        diet += [
            "Drink water slowly — stay hydrated",
        ]
        home_remedies += [
            "Box breathing: inhale 4 counts, hold 4, exhale 4",
        ]

    # ── Low pulse rate (bradycardia) advice ───────────────────────────────────
    if pulse_rate < 55:
        precautions += [
            "Lie flat on your back",
            "Do not stand up suddenly",
            "Seek medical help",
        ]
        seek_help = True

    # ── Healthy patient — maintenance advice ──────────────────────────────────
    if status == 'green':
        diet += [
            "Balanced diet with vegetables, dal, roti, curd",
            "Drink 8 glasses of water daily",
            "Include seasonal fruits",
        ]
        precautions += [
            "Light exercise 30 minutes daily",
            "Get 7-8 hours of sleep",
            "Avoid junk food",
        ]
        home_remedies += [
            "You are healthy! Maintain your routine.",
            "Amla or tulsi tea for immunity",
        ]

    return {
        "diet": diet,
        "precautions": precautions,
        "home_remedies": home_remedies,
        "seek_help": seek_help,
    }
