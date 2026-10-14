# MindSense ML backend

A modular FastAPI service for facial-expression screening indicators. It uses MediaPipe face detection with an OpenCV Haar-cascade fallback and a trained TensorFlow/Keras FER2013 classifier. The default training architecture is MobileNetV2 transfer learning; a compact 48x48 grayscale CNN is available as a fallback. The training loader supports the linked [msambare/fer2013 Kaggle dataset](https://www.kaggle.com/datasets/msambare/fer2013) directly.

> Facial expression is not a validated measure of depression or mental wellbeing. Scores are heuristic screening indicators only and must not be used for diagnosis, treatment, or urgent-care decisions.

## Structure

```text
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, health endpoint
│   ├── config.py               # Environment-based configuration
│   ├── routes/                 # Multipart image and sequence endpoints
│   ├── services/               # Inference orchestration
│   ├── models/                 # Keras model definitions and loader
│   └── utils/                  # Face detection, image prep, score mapping
├── models/                     # Trained .keras model and evaluation artifacts
├── data/                       # Put FER2013 CSV or Kaggle train/test folders here
├── train_model.py              # Training and test evaluation
├── requirements.txt
└── .env.example
```

## Setup (Windows PowerShell)

### Pinned local environment

Use **64-bit CPython 3.11** (the pinned stack targets Python 3.11; do not use 3.13). The exact package versions are pinned in `requirements.txt` to make installs repeatable and keep TensorFlow, MediaPipe, NumPy, OpenCV, and MediaPipe's JAX dependencies compatible:

| Package | Pinned version | Purpose |
|---|---:|---|
| FastAPI | 0.115.6 | HTTP API and OpenAPI docs |
| Uvicorn | 0.34.0 | ASGI server |
| python-multipart | 0.0.20 | Multipart image uploads |
| python-dotenv | 1.0.1 | Load `.env` settings |
| NumPy | 1.26.4 | Image and model arrays |
| OpenCV contrib | 4.10.0.84 | Decode images and Haar face detection |
| MediaPipe | 0.10.14 | Primary face detector |
| TensorFlow/Keras | 2.16.2 | Model training and inference |
| JAX / jaxlib | 0.4.28 / 0.4.28 | MediaPipe dependency, pinned for TensorFlow compatibility |
| ml-dtypes | 0.3.2 | TensorFlow/JAX-compatible dtype support |
| pandas | 2.2.3 | FER2013 CSV support |
| scikit-learn | 1.6.1 | Splitting, class weights, and evaluation |
| Matplotlib | 3.10.0 | Confusion-matrix plot |

Run these commands from the repository's `backend` directory. Install 64-bit Python 3.11 from python.org first if `py -3.11` is unavailable:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

If PowerShell blocks environment activation, run commands through its interpreter directly: `& (Join-Path .venv 'Scripts/python.exe') -m pip install -r requirements.txt`. Start Uvicorn the same way: `& (Join-Path .venv 'Scripts/python.exe') -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.

`.env.example` documents the supported runtime settings. In particular, `MODEL_PATH` is resolved relative to `backend/` unless it is absolute, and `CORS_ORIGINS` is a comma-separated allowlist of browser origins (scheme + host + port, no trailing slash). Update the allowlist if your frontend server uses a different port.

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `MindSense Emotion Screening API` | API title |
| `MODEL_PATH` | `models/mindsense_emotion_model.keras` | Trained Keras artifact |
| `FACE_DETECTION_CONFIDENCE` | `0.5` | MediaPipe detection threshold |
| `MAX_IMAGE_BYTES` | `10485760` | Per-image upload limit (10 MiB) |
| `MAX_SEQUENCE_FRAMES` | `30` | Maximum images in one sequence request |
| `CORS_ORIGINS` | localhost ports 5500 and 5501 | Allowed frontend origins |
| `CORS_ALLOW_CREDENTIALS` | `false` | Enable credentialed CORS only if required |

Download and extract the [msambare/fer2013 Kaggle dataset](https://www.kaggle.com/datasets/msambare/fer2013) under `backend/data/`. Its directory layout is supported as provided:

```text
backend/data/
├── train/
│   ├── angry/
│   ├── disgust/
│   ├── fear/
│   ├── happy/
│   ├── neutral/
│   ├── sad/
│   └── surprise/
└── test/
  └── ...same seven class folders...
```

The training script reserves 10% of `train/` for validation and keeps Kaggle's `test/` split for final evaluation. The supplied 48×48 grayscale images are resized to 224×224 RGB for MobileNetV2; the custom CNN uses their native 48×48 grayscale shape. The directory loader also accepts a separate `validation/` or `val/` split. Alternatively, provide the original FER2013 CSV with `emotion`, `pixels`, and `Usage` columns.

Train the default MobileNetV2 model (first run downloads ImageNet backbone weights):

```powershell
python train_model.py --data data --architecture mobilenetv2 --epochs 40
```

For the compact grayscale model, which does not download backbone weights:

```powershell
python train_model.py --data data --architecture custom_cnn --epochs 40
```

Training saves `models/mindsense_emotion_model.keras` and test-set evaluation artifacts under `models/evaluation/` (classification report, confusion-matrix CSV/PNG, and JSON). Training is intentionally explicit: no dummy weights are shipped, and inference returns HTTP 503 until you train and save a real model.

Kaggle requires account acceptance/download steps for the dataset. Follow its current access terms and attribution/license requirements; the dataset metadata identifies the Open Database License for the database. The backend does not download or redistribute the dataset automatically.

Start the API from `backend/` with the virtual environment active:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open the interactive API docs at `http://127.0.0.1:8000/docs`; check `http://127.0.0.1:8000/health` for model readiness.

## API

- `POST /api/analyze-image`: multipart form field `file`, containing one image. Returns the dominant FER emotion, normalized seven-class probability distribution, wellbeing score (0-100), screening risk label, detector used, and disclaimer.
- `POST /api/analyze-sequence`: multipart form field `files`, repeated once for each image/frame. Returns mean emotion probabilities, dominant emotion, wellbeing score, risk label, per-frame summaries, and disclaimer. Up to `MAX_SEQUENCE_FRAMES` images are accepted.
- `GET /health`: service and model readiness.

Emotion class order is `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`. Risk thresholds use the heuristic wellbeing score: below 40 = high, 40–64 = moderate, 65–100 = low. This is not a clinical scale.

Every successful analysis response contains this disclaimer verbatim: “MindSense is not a medical diagnostic tool. For concerns about depression, consult a qualified mental-health professional.”

## Connect the existing frontend

The repository frontend is static HTML/CSS/vanilla JavaScript, so keep it running from an HTTP origin rather than opening `index.html` as a `file://` URL. From the repository root, for example, run `python -m http.server 5500`; the default CORS configuration already permits `http://localhost:5500` and `http://127.0.0.1:5500`. For another port/domain, update `CORS_ORIGINS` in `backend/.env` and restart the API.

The frontend's visual file picker is `#visual-file-input` on `assessment.html`; it currently accepts a single image or video, and the existing assessment/analysis sequence is simulated. Without changing that UI, a page script can send its selected image directly:

```javascript
const file = document.querySelector('#visual-file-input').files[0];
if (file && file.type.startsWith('image/')) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('http://127.0.0.1:8000/api/analyze-image', {
    method: 'POST',
    body: form
  });
  if (!response.ok) throw new Error((await response.json()).detail || 'Image analysis failed');
  const result = await response.json();
  console.log(result.dominant_emotion, result.wellbeing_score, result.disclaimer);
}
```

For sequence analysis, append each captured frame or image to the same `FormData` using the field name `files`. Do not manually set the multipart `Content-Type`; the browser supplies the boundary. Video upload is not accepted by these image endpoints; extract frames in the browser or submit still images.

## Limitations and responsible use

FER2013 labels facial-expression categories, not depression, wellbeing, or a user's internal emotional state. Performance can vary substantially with lighting, pose, demographic representation, occlusion, and camera quality. Obtain meaningful informed consent before capturing or processing images, minimize retention, and consult a qualified mental-health professional about concerns. Never use this prototype for diagnosis, employment, eligibility, surveillance, or emergency decisions.
