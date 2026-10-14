"""Convert FER emotion probabilities into a non-clinical wellbeing indicator."""

from collections.abc import Mapping

# Heuristic valence weights, not a validated mental-health or depression scale.
EMOTION_WELLBEING_WEIGHTS = {
    "angry": 20.0,
    "disgust": 25.0,
    "fear": 25.0,
    "happy": 100.0,
    "sad": 30.0,
    "surprise": 65.0,
    "neutral": 70.0,
}


def wellbeing_score(distribution: Mapping[str, float]) -> int:
    """Return the probability-weighted emotion valence on a 0-100 scale."""
    total = sum(max(0.0, float(value)) for value in distribution.values())
    if total <= 0:
        raise ValueError("Emotion distribution must contain positive probability mass")
    weighted = sum(
        max(0.0, float(probability)) * EMOTION_WELLBEING_WEIGHTS.get(emotion, 50.0)
        for emotion, probability in distribution.items()
    )
    return max(0, min(100, round(weighted / total)))


def risk_level(score: int) -> str:
    """Map the heuristic wellbeing score to a screening-only risk label."""
    if score < 40:
        return "high"
    if score < 65:
        return "moderate"
    return "low"
