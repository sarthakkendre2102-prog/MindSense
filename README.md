# MindSense — IoT-Based Depression Monitoring System

An academic research prototype for **mental wellness monitoring and screening** combining Web Technologies, Artificial Intelligence / Machine Learning, and Internet of Things (IoT) hardware.

> **IMPORTANT SCOPE NOTICE**: MindSense is engineered for **mental wellness monitoring and screening estimates**, not clinical or medical diagnosis. It does not replace professional medical evaluations.

---

## 🌟 Tech Stack & Architecture

- **Frontend**: Pure Semantic HTML5, Modern Responsive CSS3, and Vanilla JavaScript (ES6+). Zero external frameworks (no React, Angular, Vue, Bootstrap, or Tailwind).
- **Styling System**: CSS Custom Properties (`--primary: #6C5CE7`, `--dark: #202335`, `--bg-main: #F7F7FB`, etc.), smooth responsive layouts, glassmorphic headers, and subtle box shadows.
- **State Management**: Clean `localStorage` state wrappers for user credentials, profile attributes, ethical consent, multimodal assessment submissions, and IoT telemetry.
- **Visualizations**: Pure SVG responsive line chart generator with cubic bezier smoothing, gradient area fill, and interactive hover data points.
- **Multimodal Subsystems**:
  1. **Text**: Reflection sentiment & semantic check-in with live word/char counters.
  2. **Audio**: Canvas-based real-time frequency bar waveform recorder simulation.
  3. **Visual**: Drag-and-drop file picker with instant media previews.
  4. **IoT**: ESP32 biosensor node telemetry stream (Heart rate, skin temperature, activity, sleep).

---

## 📂 Project Directory Structure

```text
MindSense/
│
├── index.html           # 1. Landing page with hero mockup & research scope
├── register.html        # 2. User registration with real-time validation
├── login.html           # 3. Authentication with demo credentials pre-fill
├── profile.html         # 4. Profile setup & simulated ESP32 device pairing
├── consent.html         # 5. Ethical privacy, multimodal disclosures & consent
├── assessment.html      # 6. Multimodal data intake (Text, Audio, Visual, IoT)
├── analysis.html        # 7. Animated AI pipeline synthesis & progress tracker
├── dashboard.html       # 8. Flagship SaaS-grade mental wellness dashboard
│
├── css/
│   ├── global.css       # Design tokens, reset, typography, buttons, badges
│   ├── landing.css      # Hero, features grid, timeline, and footer
│   ├── auth.css         # Registration & login forms, validation styles
│   ├── onboarding.css   # Profile personalization and consent layout
│   ├── assessment.css   # 4-card multimodal grid & waveform canvas styles
│   ├── analysis.css     # Neural pulse animation & pipeline stage trackers
│   └── dashboard.css    # Sidebar, topbar, metric cards, and SVG chart styles
│
├── js/
│   ├── app.js           # Core state management, session helpers, API hooks
│   ├── auth.js          # Client-side validation & registration simulation
│   ├── assessment.js    # Canvas audio waveform, media reader, IoT stream
│   ├── analysis.js      # Multi-stage AI pipeline orchestrator & redirect
│   └── dashboard.js     # SVG trend line chart generator, telemetry feed
│
└── assets/
    ├── icons/           # Custom SVG brand icons
    └── images/          # Avatar placeholders & diagrams
```

---

## 🚀 How to Run the Project

1. **No build steps or package managers required!**
2. Simply double-click `index.html` or open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).
3. Experience the complete end-to-end flow:
   ```text
   index.html ➔ register.html ➔ login.html ➔ profile.html ➔ consent.html ➔ assessment.html ➔ analysis.html ➔ dashboard.html
   ```
4. For quick demonstrations to project guides or evaluators, use the built-in **"⚡ Fill Demo Data"** buttons on the registration and login screens.

---

## 🔌 Future Python / Machine Learning Integration Guide

All JavaScript handlers include clearly marked API hooks and documentation comments inside `js/app.js` and `js/assessment.js`.

When you are ready to connect a Python (FastAPI / Flask) backend:

```text
HTML / CSS / JS (MindSense Frontend)
       ↓  (HTTP POST JSON / Multipart FormData)
FastAPI / Flask REST Gateway (e.g. http://localhost:8000/api/v1/assessment/predict)
       ↓
Pre-trained PyTorch / TensorFlow Models:
       ├── 1. Text Model: DistilBERT / RoBERTa (Sentiment & Psycholinguistic Lexicon)
       ├── 2. Audio Model: Wav2Vec 2.0 / OpenSMILE (Prosody, Jitter, Pitch)
       ├── 3. Visual Model: ResNet / Mediapipe (Facial Action Units & Valence)
       └── 4. IoT Telemetry: Biometric LSTM / Random Forest (HRV, Sleep, Autonomic metrics)
       ↓
Multimodal Cross-Attention Fusion Layer
       ↓
Longitudinal Wellness Risk Estimation (0-100 Screening Gauge)
       ↓
MindSense Dashboard (JSON payload response)
```

---

## ⚖️ Ethical & Academic Compliance

This system explicitly restricts its terminology to:
- "wellness risk estimate"
- "screening indicator"
- "pattern detected"
- "monitoring trend"

It **never** outputs a clinical diagnosis of depression, fulfilling strict medical research and ethics committee protocols.
