"""Image decoding and model-input preparation."""

from __future__ import annotations

import cv2
import numpy as np

from app.models.emotion_model import EMOTIONS


def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode untrusted image bytes as a BGR image, rejecting invalid payloads."""
    encoded = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None or image.size == 0:
        raise ValueError("The uploaded file is not a readable image")
    return image


def prepare_face(face_bgr: np.ndarray, input_shape: tuple) -> np.ndarray:
    """Match a cropped face to either the 48x48 CNN or RGB MobileNet input."""
    height = int(input_shape[1] or 224)
    width = int(input_shape[2] or 224)
    channels = int(input_shape[3] or 3)
    grayscale = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(grayscale, (width, height), interpolation=cv2.INTER_AREA)

    if channels == 1:
        tensor = resized[..., np.newaxis]
    elif channels == 3:
        tensor = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
    else:
        raise ValueError(f"Unsupported model channel count: {channels}")

    return np.expand_dims(tensor.astype(np.float32) / 255.0, axis=0)


def probabilities_to_distribution(probabilities: np.ndarray) -> dict[str, float]:
    values = np.asarray(probabilities, dtype=np.float64).reshape(-1)
    if values.size != len(EMOTIONS):
        raise ValueError(f"Expected {len(EMOTIONS)} emotion probabilities, received {values.size}")
    values = np.clip(values, 0.0, None)
    total = float(values.sum())
    if total <= 0:
        raise ValueError("Model returned an invalid probability distribution")
    values /= total
    return {emotion: float(values[index]) for index, emotion in enumerate(EMOTIONS)}
