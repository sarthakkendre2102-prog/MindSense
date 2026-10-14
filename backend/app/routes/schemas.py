"""Response schema declarations for API documentation."""

from pydantic import BaseModel, Field


class ImageAnalysisResponse(BaseModel):
    dominant_emotion: str
    emotion_distribution: dict[str, float]
    confidence: float = Field(ge=0, le=1)
    wellbeing_score: int = Field(ge=0, le=100)
    risk_level: str
    face_detected: bool
    face_detector: str
    disclaimer: str


class SequenceAnalysisResponse(BaseModel):
    dominant_emotion: str
    emotion_distribution: dict[str, float]
    wellbeing_score: int = Field(ge=0, le=100)
    risk_level: str
    frame_count: int
    per_frame: list[dict]
    disclaimer: str
