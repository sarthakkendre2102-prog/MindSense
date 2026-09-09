/**
 * ==========================================================================
 * MINDSENSE — INITIAL ASSESSMENT LOGIC (assessment.js)
 * Interactive Multimodal Collector:
 * 1. Text Check-in & Live Word Count
 * 2. Canvas-based Audio Waveform & Voice Recording Simulator
 * 3. Media Upload & Dynamic Image/Video Preview
 * 4. ESP32 Live Telemetry Feed
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initTextCheckIn();
  initAudioRecorder();
  initVisualUploader();
  initIoTLiveFeed();
  initAssessmentSubmission();
});

/* ==========================================================================
   1. TEXT CHECK-IN HANDLER
   ========================================================================== */
function initTextCheckIn() {
  const textArea = document.getElementById('text-checkin-input');
  const wordCountEl = document.getElementById('text-word-count');
  const charCountEl = document.getElementById('text-char-count');
  const textBadge = document.getElementById('text-status-badge');
  const sampleTextBtn = document.getElementById('insert-sample-text-btn');

  if (!textArea) return;

  function updateCounts() {
    const text = textArea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = textArea.value.length;

    if (wordCountEl) wordCountEl.textContent = `${words} words`;
    if (charCountEl) charCountEl.textContent = `${chars} chars`;

    if (textBadge) {
      if (words >= 3) {
        textBadge.className = 'badge badge-success';
        textBadge.textContent = 'Text Ready';
      } else {
        textBadge.className = 'badge badge-warning';
        textBadge.textContent = 'Awaiting Input';
      }
    }
  }

  textArea.addEventListener('input', updateCounts);

  if (sampleTextBtn) {
    sampleTextBtn.addEventListener('click', () => {
      textArea.value = "I've been feeling a bit overwhelmed and exhausted over the past few days. Finding it hard to focus during the afternoon, though I slept reasonably well.";
      updateCounts();
      MindSenseToast.show('Sample reflective journal entry loaded', 'info');
    });
  }

  updateCounts();
}

/* ==========================================================================
   2. AUDIO RECORDING & CANVAS WAVEFORM VISUALIZER
   ========================================================================== */
function initAudioRecorder() {
  const canvas = document.getElementById('audio-waveform-canvas');
  const startBtn = document.getElementById('audio-start-btn');
  const stopBtn = document.getElementById('audio-stop-btn');
  const timerEl = document.getElementById('audio-timer');
  const recDot = document.getElementById('recording-dot');
  const audioBadge = document.getElementById('audio-status-badge');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isRecording = false;
  let animationId = null;
  let secondsElapsed = 0;
  let timerInterval = null;

  // Set high-DPI canvas resolution
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Audio frequency bar simulation
  const numBars = 36;
  const bars = Array.from({ length: numBars }, () => ({
    height: 10,
    targetHeight: 10,
    speed: 0.15
  }));

  function drawWaveform() {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / numBars) * 0.65;
    const gap = (width / numBars) * 0.35;

    for (let i = 0; i < numBars; i++) {
      if (isRecording) {
        // Dynamic voice wave response
        if (Math.random() < 0.25) {
          bars[i].targetHeight = 12 + Math.random() * (height * 0.75);
        }
      } else {
        bars[i].targetHeight = 6;
      }

      bars[i].height += (bars[i].targetHeight - bars[i].height) * bars[i].speed;

      const x = i * (barWidth + gap) + gap / 2;
      const y = (height - bars[i].height) / 2;

      const gradient = ctx.createLinearGradient(0, y, 0, y + bars[i].height);
      if (isRecording) {
        gradient.addColorStop(0, '#6C5CE7');
        gradient.addColorStop(1, '#00CEC9');
      } else {
        gradient.addColorStop(0, '#3A3F58');
        gradient.addColorStop(1, '#2B2F44');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, bars[i].height, 4) : ctx.rect(x, y, barWidth, bars[i].height);
      ctx.fill();
    }

    animationId = requestAnimationFrame(drawWaveform);
  }

  drawWaveform();

  // Start Voice Recording
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      isRecording = true;
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-flex';
      recDot.classList.add('active');

      if (audioBadge) {
        audioBadge.className = 'badge badge-warning';
        audioBadge.textContent = 'Recording...';
      }

      secondsElapsed = 0;
      updateTimerDisplay();
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
        if (secondsElapsed >= 15) {
          // Auto-stop after 15 seconds demo duration
          stopRecording();
        }
      }, 1000);

      MindSenseToast.show('Microphone active. Speak naturally for analysis.', 'info');
    });
  }

  // Stop Recording
  function stopRecording() {
    isRecording = false;
    clearInterval(timerInterval);
    if (recDot) recDot.classList.remove('active');
    if (stopBtn) stopBtn.style.display = 'none';
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
      startBtn.textContent = 'Re-record Sample';
    }

    if (audioBadge) {
      audioBadge.className = 'badge badge-success';
      audioBadge.textContent = 'Recording Complete';
    }

    MindSenseToast.show('Audio sample captured and encoded.', 'success');
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopRecording);
  }

  function updateTimerDisplay() {
    if (!timerEl) return;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs} / 00:15`;
  }
}

/* ==========================================================================
   3. VISUAL SAMPLE UPLOAD & INSTANT PREVIEW
   ========================================================================== */
function initVisualUploader() {
  const dropzone = document.getElementById('visual-dropzone');
  const fileInput = document.getElementById('visual-file-input');
  const previewContainer = document.getElementById('visual-preview-container');
  const previewImg = document.getElementById('visual-preview-img');
  const previewVideo = document.getElementById('visual-preview-video');
  const removeBtn = document.getElementById('visual-remove-btn');
  const visualBadge = document.getElementById('visual-status-badge');
  const dropzoneContent = document.getElementById('visual-dropzone-content');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', (e) => {
    if (e.target !== removeBtn) {
      fileInput.click();
    }
  });

  // Drag and drop handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
      dropzone.style.backgroundColor = 'var(--primary-light)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.backgroundColor = '';
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleSelectedFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  function handleSelectedFile(file) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      MindSenseToast.show('Please upload an image or video file.', 'warning');
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    dropzoneContent.style.display = 'none';
    previewContainer.style.display = 'block';

    if (isImage) {
      previewImg.src = objectUrl;
      previewImg.style.display = 'block';
      if (previewVideo) previewVideo.style.display = 'none';
    } else if (isVideo) {
      previewVideo.src = objectUrl;
      previewVideo.style.display = 'block';
      if (previewImg) previewImg.style.display = 'none';
    }

    if (visualBadge) {
      visualBadge.className = 'badge badge-success';
      visualBadge.textContent = 'Visual Ready';
    }

    MindSenseToast.show(`Uploaded: ${file.name}`, 'success');
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      if (previewImg) previewImg.src = '';
      if (previewVideo) previewVideo.src = '';
      previewContainer.style.display = 'none';
      dropzoneContent.style.display = 'flex';

      if (visualBadge) {
        visualBadge.className = 'badge badge-warning';
        visualBadge.textContent = 'Optional / Ready';
      }
    });
  }
}

/* ==========================================================================
   4. IOT LIVE TELEMETRY SIMULATION
   ========================================================================== */
function initIoTLiveFeed() {
  const hrEl = document.getElementById('iot-live-hr');
  const tempEl = document.getElementById('iot-live-temp');
  const activityEl = document.getElementById('iot-live-activity');
  const sleepEl = document.getElementById('iot-live-sleep');

  if (!hrEl) return;

  // Subtle telemetry pulse
  setInterval(() => {
    const iot = MindSenseState.get(STORAGE_KEYS.IOT);
    if (iot && iot.metrics) {
      // Small real-time heartbeat variance
      const hr = 76 + Math.floor(Math.random() * 6);
      hrEl.textContent = `${hr} BPM`;
      if (tempEl) tempEl.textContent = `${iot.metrics.temperature} °C`;
      if (activityEl) activityEl.textContent = iot.metrics.activity;
      if (sleepEl) sleepEl.textContent = iot.metrics.sleepDuration;
    }
  }, 3500);
}

/* ==========================================================================
   5. ASSESSMENT SUBMISSION & TRANSITION
   ========================================================================== */
function initAssessmentSubmission() {
  const submitBtn = document.getElementById('submit-assessment-btn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', () => {
    const textArea = document.getElementById('text-checkin-input');
    const textVal = textArea ? textArea.value.trim() : '';

    const payload = {
      textResponse: textVal || "Feeling steady, regular academic workload today.",
      hasAudio: true,
      hasVisual: true,
      iotConnected: true,
      submittedAt: new Date().toISOString()
    };

    // Save assessment data to state
    MindSenseState.set(STORAGE_KEYS.ASSESSMENT, payload);

    MindSenseToast.show('Assessment submitted! Initializing multimodal pipeline...', 'info');

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="pulse-dot" style="width:12px; height:12px;" viewBox="0 0 24 24"></svg>
      Preparing Analysis Pipeline...
    `;

    setTimeout(() => {
      window.location.href = 'analysis.html';
    }, 900);
  });
}
