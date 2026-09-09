/**
 * ==========================================================================
 * MINDSENSE — AI ANALYSIS PIPELINE CONTROLLER (analysis.js)
 * Orchestrates multi-stage multimodal simulation with dynamic progress tracking
 * and automatic transition to the wellness dashboard.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  runAnalysisPipeline();
});

function runAnalysisPipeline() {
  const progressBar = document.getElementById('pipeline-progress-fill');
  const percentText = document.getElementById('pipeline-percent-text');
  const statusLabel = document.getElementById('pipeline-status-label');

  // Stages configuration
  const stages = [
    { id: 'stage-text', title: 'Text Sentiment & Semantic Extraction', weight: 16 },
    { id: 'stage-audio', title: 'Acoustic Prosody & Pitch Analysis', weight: 33 },
    { id: 'stage-visual', title: 'Visual Affect & Facial Action Units', weight: 50 },
    { id: 'stage-iot', title: 'IoT Autonomic & Circadian Signals', weight: 68 },
    { id: 'stage-fusion', title: 'Multimodal Cross-Attention Fusion', weight: 85 },
    { id: 'stage-risk', title: 'Wellness Risk Index Estimation', weight: 100 }
  ];

  let currentStageIndex = 0;
  let progress = 0;

  // Set initial state
  updateStageStatus(stages[0].id, 'analyzing');

  const interval = setInterval(() => {
    progress += 1;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${progress}%`;

    // Determine current stage based on progress
    const activeStage = stages[currentStageIndex];

    if (progress >= activeStage.weight) {
      // Mark current stage completed
      updateStageStatus(activeStage.id, 'completed');
      currentStageIndex++;

      if (currentStageIndex < stages.length) {
        // Begin next stage
        updateStageStatus(stages[currentStageIndex].id, 'analyzing');
        if (statusLabel) {
          statusLabel.textContent = `Processing: ${stages[currentStageIndex].title}...`;
        }
      }
    }

    // Finished
    if (progress >= 100) {
      clearInterval(interval);
      if (statusLabel) statusLabel.textContent = 'Multimodal Fusion Complete! Loading Dashboard...';

      MindSenseToast.show('Analysis complete! Redirecting to wellness dashboard...', 'success');

      // Update state with simulated result payload
      const assessmentResult = {
        overallRisk: 56,
        riskLevel: 'Moderate',
        textScore: 62,
        audioScore: 55,
        visualScore: 48,
        iotScore: 59,
        calculatedAt: new Date().toISOString()
      };
      MindSenseState.set('mindsense_latest_result', assessmentResult);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    }
  }, 45); // Completes in ~4.5 seconds
}

function updateStageStatus(stageId, status) {
  const stageEl = document.getElementById(stageId);
  if (!stageEl) return;

  const iconEl = stageEl.querySelector('.stage-icon-status');
  const badgeEl = stageEl.querySelector('.stage-status-badge');

  stageEl.classList.remove('analyzing', 'completed');

  if (status === 'analyzing') {
    stageEl.classList.add('analyzing');
    if (badgeEl) badgeEl.textContent = 'Analyzing...';
    if (iconEl) iconEl.textContent = '...';
  } else if (status === 'completed') {
    stageEl.classList.add('completed');
    if (badgeEl) badgeEl.textContent = 'Complete';
    if (iconEl) iconEl.textContent = '✓';
  } else {
    if (badgeEl) badgeEl.textContent = 'Waiting';
    if (iconEl) iconEl.textContent = '○';
  }
}
