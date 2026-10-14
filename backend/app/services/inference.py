"""Orchestrate face detection, emotion inference, and screening aggregation."""

from __future__ import annotations

from app.config import settings
from app.models.emotion_model import EmotionModel
from app.utils.face_detection import detect_and_crop_face
from app.utils.image_processing import decode_image, prepare_face, probabilities_to_distribution
from app.utils.wellbeing import risk_level, wellbeing_score

DISCLAIMER = (
    "MindSense is not a medical diagnostic tool. For concerns about depression, "
    "consult a qualified mental-health professional."
)

emotion_model = EmotionModel(settings.model_path)


def analyze_image(image_bytes: bytes) -> dict:
    image = decode_image(image_bytes)
    face = detect_and_crop_face(image)
    if face is None:
        raise LookupError("No face was detected. Use a clear, front-facing image and try again.")

    model = emotion_model.get_model()
    batch = prepare_face(face.image, tuple(model.input_shape))
    distribution = probabilities_to_distribution(model.predict(batch, verbose=0)[0])
    dominant = max(distribution, key=distribution.get)
    score = wellbeing_score(distribution)
    return {
        "dominant_emotion": dominant,
        "emotion_distribution": distribution,
        "confidence": distribution[dominant],
        "wellbeing_score": score,
        "risk_level": risk_level(score),
        "face_detected": True,
        "face_detector": face.detector,
        "disclaimer": DISCLAIMER,
    }


def analyze_sequence(image_payloads: list[bytes]) -> dict:
    results = [analyze_image(payload) for payload in image_payloads]
    emotions = results[0]["emotion_distribution"].keys()
    average_distribution = {
        emotion: sum(result["emotion_distribution"][emotion] for result in results) / len(results)
        for emotion in emotions
    }
    dominant = max(average_distribution, key=average_distribution.get)
    score = wellbeing_score(average_distribution)
    return {
        "dominant_emotion": dominant,
        "emotion_distribution": average_distribution,
        "wellbeing_score": score,
        "risk_level": risk_level(score),
        "frame_count": len(results),
        "per_frame": [
            {
                "dominant_emotion": result["dominant_emotion"],
                "emotion_distribution": result["emotion_distribution"],
                "wellbeing_score": result["wellbeing_score"],
            }
            for result in results
        ],
        "disclaimer": DISCLAIMER,
    }
