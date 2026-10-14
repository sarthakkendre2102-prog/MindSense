"""FastAPI application entry point for the MindSense screening API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.analysis import router as analysis_router

app = FastAPI(
    title=settings.app_name,
    description=(
        "Facial-expression screening indicators only; this service does not diagnose "
        "depression or any other medical condition."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=settings.allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(analysis_router)


@app.get("/health", tags=["system"])
def health():
    return {
        "status": "ok",
        "model_ready": settings.model_path.is_file(),
        "message": "A trained model is required before image analysis is available.",
    }
