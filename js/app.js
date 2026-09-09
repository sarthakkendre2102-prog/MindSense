/**
 * ==========================================================================
 * MINDSENSE — SHARED CORE APPLICATION MODULE (app.js)
 * IoT-Based Depression Monitoring & Mental Wellness Screening System
 * ==========================================================================
 *
 * This module manages:
 * 1. Global state persistence via LocalStorage keys
 * 2. Session authentication checks and logout flow
 * 3. User feedback (dynamic floating toast notifications)
 * 4. Academic architecture hooks for Python (FastAPI/Flask) ML Backend
 */

const STORAGE_KEYS = {
  USER: 'mindsense_user',
  PROFILE: 'mindsense_profile',
  CONSENT: 'mindsense_consent',
  ASSESSMENT: 'mindsense_assessment',
  IOT: 'mindsense_iot',
  NOTIFICATIONS: 'mindsense_notifications'
};

/* ==========================================================================
   1. STATE MANAGEMENT & LOCAL STORAGE HELPERS
   ========================================================================== */

const MindSenseState = {
  // Retrieve parsed object from localStorage
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  },

  // Save object to localStorage as JSON
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  },

  // Remove key from localStorage
  remove(key) {
    localStorage.removeItem(key);
  },

  // Clear all MindSense project keys
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  // Initialize sample demo defaults if empty
  initDefaults() {
    if (!this.get(STORAGE_KEYS.USER)) {
      this.set(STORAGE_KEYS.USER, {
        fullName: 'Sarthak Kendre',
        email: 'sarthak@mindsense.ai',
        createdAt: new Date().toISOString()
      });
    }

    if (!this.get(STORAGE_KEYS.PROFILE)) {
      this.set(STORAGE_KEYS.PROFILE, {
        displayName: 'Sarthak Kendre',
        age: 23,
        gender: 'Male',
        dailyReminder: '20:00',
        iotConnected: true
      });
    }

    if (!this.get(STORAGE_KEYS.IOT)) {
      this.set(STORAGE_KEYS.IOT, {
        deviceId: 'ESP32-MS-8492',
        deviceName: 'MindSense ESP32 Biosensor Node',
        connected: true,
        firmware: 'v2.4.1-ble',
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        battery: 92,
        metrics: {
          heartRate: 78,
          temperature: 36.7,
          activity: 'Moderate',
          sleepDuration: '6h 42m',
          hrv: 54 // Heart Rate Variability (ms)
        }
      });
    }

    if (!this.get(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, [
        { id: 1, title: 'Check-in Scheduled', message: 'Your daily multimodal check-in is due today.', time: '10m ago', read: false },
        { id: 2, title: 'IoT Node Online', message: 'MindSense ESP32 biosensor paired and active.', time: '1h ago', read: false },
        { id: 3, title: 'Model Pipeline Ready', message: 'Multimodal screening weights synchronized.', time: 'Yesterday', read: true }
      ]);
    }
  }
};

// Initialize defaults quietly
MindSenseState.initDefaults();

/* ==========================================================================
   2. AUTHENTICATION & USER HELPERS
   ========================================================================== */

const MindSenseAuth = {
  // Check if an active user session exists
  isLoggedIn() {
    return !!MindSenseState.get(STORAGE_KEYS.USER);
  },

  // Get current active user
  getCurrentUser() {
    return MindSenseState.get(STORAGE_KEYS.USER) || {
      fullName: 'Sarthak Kendre',
      email: 'sarthak@mindsense.ai'
    };
  },

  // Get current user profile details
  getProfile() {
    return MindSenseState.get(STORAGE_KEYS.PROFILE) || {
      displayName: 'Sarthak Kendre',
      age: 23,
      gender: 'Male',
      dailyReminder: '20:00'
    };
  },

  // Get user initials for avatar
  getInitials(name) {
    if (!name) return 'SK';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Terminate session and redirect to login
  logout() {
    MindSenseToast.show('Logging out securely...', 'info');
    setTimeout(() => {
      // Clear session data if desired, or keep demo defaults
      window.location.href = 'login.html';
    }, 600);
  }
};

/* ==========================================================================
   3. TOAST NOTIFICATION SYSTEM
   ========================================================================== */

const MindSenseToast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
  },

  show(message, type = 'info', duration = 3800) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--warning)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="flex:1; font-size:0.9rem; font-weight:500; line-height:1.35;">${message}</div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

/* ==========================================================================
   4. TIME-BASED GREETING & DATE HELPERS
   ========================================================================== */

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedCurrentDate() {
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  return new Date().toLocaleDateString('en-US', options);
}

/* ==========================================================================
   5. ACADEMIC EXTENSION HOOKS: PYTHON ML BACKEND INTEGRATION
   ==========================================================================
   This architectural service demonstrates how this frontend will communicate
   with a future Python / FastAPI / Flask backend once machine learning models
   (NLP sentiment, Speech prosody, Facial action units, and IoT fusion) are trained.
   ========================================================================== */

const MindSenseAPI = {
  // Base endpoint for future Python backend (e.g. FastAPI / Flask)
  BASE_URL: 'http://127.0.0.1:8000/api/v1',

  /**
   * FUTURE BACKEND INTEGRATION POINT:
   * Submit multimodal assessment payload for inference.
   *
   * Example Python API signature:
   * @app.post("/api/v1/assessment/predict")
   * async def predict_wellness(
   *    text: str,
   *    audio_file: UploadFile,
   *    visual_file: UploadFile,
   *    iot_telemetry: IoTData
   * ) -> MultimodalInferenceResponse:
   *    ...
   */
  async submitAssessmentForInference(payload) {
    console.log('[MindSense API Hook] Payload ready for Python ML pipeline:', payload);

    /*
    // REAL BACKEND CALL (uncomment when FastAPI is connected):
    const formData = new FormData();
    formData.append('text', payload.text);
    if (payload.audioBlob) formData.append('audio', payload.audioBlob);
    if (payload.visualFile) formData.append('visual', payload.visualFile);
    formData.append('iot', JSON.stringify(payload.iot));

    const response = await fetch(`${this.BASE_URL}/assessment/predict`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
    */

    // Simulated inference result for academic prototype demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          overallRiskScore: 56, // 0-100 scale (Screening estimate)
          riskLevel: 'Moderate',
          confidenceInterval: [51, 61],
          modalityScores: {
            textSentimentScore: 62, // Sub-indicator
            audioProsodyScore: 55,  // Sub-indicator
            visualAffectScore: 48,  // Sub-indicator
            iotAutonomicScore: 59   // Sub-indicator
          },
          disclaimer: 'Screening estimate only; not a medical diagnosis.'
        });
      }, 3500);
    });
  },

  /**
   * FUTURE BACKEND INTEGRATION POINT:
   * Poll live telemetry from ESP32 via MQTT/HTTP Gateway.
   */
  async fetchLiveIoTTelemetry(deviceId) {
    console.log(`[MindSense API Hook] Polling telemetry for device: ${deviceId}`);
    // Simulated sensor fluctuation around baseline
    const iot = MindSenseState.get(STORAGE_KEYS.IOT);
    if (iot && iot.metrics) {
      // Add subtle natural variation for live presentation
      const hrVariance = (Math.random() * 4 - 2);
      const tempVariance = (Math.random() * 0.2 - 0.1);
      iot.metrics.heartRate = Math.round(78 + hrVariance);
      iot.metrics.temperature = +(36.7 + tempVariance).toFixed(1);
      iot.lastSync = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      MindSenseState.set(STORAGE_KEYS.IOT, iot);
      return iot;
    }
    return null;
  }
};

// Global expose for ease of access
window.MindSenseState = MindSenseState;
window.MindSenseAuth = MindSenseAuth;
window.MindSenseToast = MindSenseToast;
window.MindSenseAPI = MindSenseAPI;
window.getTimeBasedGreeting = getTimeBasedGreeting;
window.getFormattedCurrentDate = getFormattedCurrentDate;
