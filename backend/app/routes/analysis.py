"""Image and frame-sequence analysis endpoints."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.routes.schemas import ImageAnalysisResponse, SequenceAnalysisResponse
from app.services.inference import analyze_image, analyze_sequence

router = APIRouter(prefix="/api", tags=["emotion analysis"])


def _read_upload(upload: UploadFile) -> bytes:
    payload = upload.file.read(settings.max_image_bytes + 1)
    if not payload:
        raise HTTPException(status_code=400, detail=f"{upload.filename or 'Upload'} is empty")
    if len(payload) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="Uploaded image exceeds the configured size limit")
    return payload


def _analyze(callable_, *args):
    try:
        return callable_(*args)
    except LookupError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_single_image(file: UploadFile = File(..., description="Image containing one face")):
    """Detect a face in one uploaded image and return FER2013 emotion probabilities."""
    return _analyze(analyze_image, _read_upload(file))


@router.post("/analyze-sequence", response_model=SequenceAnalysisResponse)
def analyze_image_sequence(files: list[UploadFile] = File(..., description="Repeated image/frame uploads")):
    """Analyze multiple uploaded image frames and average their emotion probabilities."""
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image frame")
    if len(files) > settings.max_sequence_frames:
        raise HTTPException(
            status_code=413,
            detail=f"At most {settings.max_sequence_frames} frames are allowed per request",
        )
    payloads = [_read_upload(upload) for upload in files]
    return _analyze(analyze_sequence, payloads)
