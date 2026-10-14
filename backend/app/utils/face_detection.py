"""Face localization using MediaPipe with an OpenCV Haar-cascade fallback."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FaceCrop:
    image: np.ndarray
    detector: str


def _mediapipe_box(image_rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    try:
        import mediapipe as mp

        face_detection = mp.solutions.face_detection
        with face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=settings.face_detection_confidence,
        ) as detector:
            result = detector.process(image_rgb)
        if not result.detections:
            return None
        height, width = image_rgb.shape[:2]
        detection = max(result.detections, key=lambda item: item.score[0])
        box = detection.location_data.relative_bounding_box
        x = round(box.xmin * width)
        y = round(box.ymin * height)
        return x, y, round(box.width * width), round(box.height * height)
    except Exception as exc:  # MediaPipe may be unavailable on some Python/platform builds.
        logger.debug("MediaPipe face detection unavailable; using OpenCV: %s", exc)
        return None


def _opencv_box(image_bgr: np.ndarray) -> tuple[int, int, int, int] | None:
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    detector = cv2.CascadeClassifier(cascade_path)
    if detector.empty():
        raise RuntimeError("OpenCV face-detection cascade could not be loaded")
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    boxes = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(boxes) == 0:
        return None
    return tuple(int(value) for value in max(boxes, key=lambda box: box[2] * box[3]))


def detect_and_crop_face(image_bgr: np.ndarray) -> FaceCrop | None:
    """Return the largest/highest-confidence face crop, or None if no face exists."""
    height, width = image_bgr.shape[:2]
    box = _mediapipe_box(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
    detector_name = "mediapipe"
    if box is None:
        box = _opencv_box(image_bgr)
        detector_name = "opencv_haar"
    if box is None:
        return None

    x, y, face_width, face_height = box
    if face_width <= 0 or face_height <= 0:
        return None
    margin_x = round(face_width * 0.12)
    margin_y = round(face_height * 0.12)
    left = max(0, x - margin_x)
    top = max(0, y - margin_y)
    right = min(width, x + face_width + margin_x)
    bottom = min(height, y + face_height + margin_y)
    crop = image_bgr[top:bottom, left:right]
    return FaceCrop(crop, detector_name) if crop.size else None
