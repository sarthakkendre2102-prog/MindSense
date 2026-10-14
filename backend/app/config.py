"""Application configuration loaded from environment variables and .env."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def _csv_env(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


class Settings:
    app_name = os.getenv("APP_NAME", "MindSense Emotion Screening API")
    _configured_model_path = Path(os.getenv("MODEL_PATH", "models/mindsense_emotion_model.keras"))
    model_path = (
        _configured_model_path
        if _configured_model_path.is_absolute()
        else BACKEND_DIR / _configured_model_path
    )
    face_detection_confidence = float(os.getenv("FACE_DETECTION_CONFIDENCE", "0.5"))
    max_image_bytes = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
    max_sequence_frames = int(os.getenv("MAX_SEQUENCE_FRAMES", "30"))
    allowed_origins = _csv_env(
        "CORS_ORIGINS",
        "http://localhost:5500,http://127.0.0.1:5500,http://localhost:5501,http://127.0.0.1:5501",
    )
    allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() == "true"


settings = Settings()
