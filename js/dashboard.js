/**
 * ==========================================================================
 * MINDSENSE — DASHBOARD CONTROLLER (dashboard.js)
 * Manages SaaS wellness dashboard, SVG trend line charts, real-time IoT feeds,
 * modals, notifications, and mobile navigation.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardUserData();
  initWellnessTrendChart();
  initIoTLiveTelemetry();
  initModalsAndDrawers();
  initNotificationsCenter();
  initLogoutHandler();
});

/* ==========================================================================
   1. USER DATA & GREETING BINDING
   ========================================================================== */
function initDashboardUserData() {
  const user = MindSenseAuth.getCurrentUser();
  const profile = MindSenseAuth.getProfile();

  const greetingEl = document.getElementById('user-greeting-heading');
  const dateEl = document.getElementById('current-date-display');
  const avatarEl = document.getElementById('user-avatar-initials');
  const nameEl = document.getElementById('user-name-display');

  const firstName = (profile.displayName || user.fullName || 'Sarthak').split(' ')[0];
  const greeting = getTimeBasedGreeting();

  if (greetingEl) {
    greetingEl.innerHTML = `${greeting}, ${firstName} <span style="display:inline-block; animation: wave 2s infinite;">👋</span>`;
  }

  if (dateEl) {
    dateEl.textContent = getFormattedCurrentDate();
  }

  if (avatarEl) {
    avatarEl.textContent = MindSenseAuth.getInitials(profile.displayName || user.fullName);
  }

  if (nameEl) {
    nameEl.textContent = profile.displayName || user.fullName;
  }
}

/* ==========================================================================
   2. SVG WELLNESS TREND CHART GENERATOR (Zero Frameworks)
   ========================================================================== */
function initWellnessTrendChart() {
  const chartContainer = document.getElementById('svg-chart-container');
  const periodSelect = document.getElementById('chart-period-select');
  if (!chartContainer) return;

  const dataset7Days = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [42, 48, 52, 47, 58, 53, 56]
  };

  const dataset30Days = {
    labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    values: [40, 44, 46, 50, 48, 54, 56]
  };

  function renderChart(data) {
    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 40, left: 40 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minVal = 30;
    const maxVal = 75;

    // Calculate (x, y) coordinates
    const points = data.values.map((val, idx) => {
      const x = padding.left + (idx / (data.values.length - 1)) * chartW;
      const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, val, label: data.labels[idx] };
    });

    // Build smooth cubic bezier curve
    function getBezierPath(pts) {
      let path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) / 2;
        const cp1y = pts[i].y;
        const cp2x = pts[i].x + (pts[i + 1].x - pts[i].x) / 2;
        const cp2y = pts[i + 1].y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
      }
      return path;
    }

    const curvePath = getBezierPath(points);
    const areaPath = `${curvePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Horizontal grid lines
    const gridLines = [30, 45, 60, 75].map(tick => {
      const y = padding.top + chartH - ((tick - minVal) / (maxVal - minVal)) * chartH;
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#EAEBF2" stroke-dasharray="4 4" stroke-width="1" />
        <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#858B9B" font-family="var(--font-sans)">${tick}</text>
      `;
    }).join('');

    // X-axis labels
    const xLabels = points.map(pt => `
      <text x="${pt.x}" y="${height - 12}" text-anchor="middle" font-size="12" font-weight="600" fill="#858B9B" font-family="var(--font-sans)">${pt.label}</text>
    `).join('');

    // Interactive data dots with tooltips
    const dots = points.map(pt => `
      <g class="chart-point-group" tabindex="0" style="cursor: pointer;">
        <circle cx="${pt.x}" cy="${pt.y}" r="6" fill="#FFFFFF" stroke="#6C5CE7" stroke-width="3.5" class="chart-circle">
          <title>${pt.label}: Risk Score ${pt.val}/100 (Screening estimate)</title>
        </circle>
        <circle cx="${pt.x}" cy="${pt.y}" r="12" fill="transparent" />
      </g>
    `).join('');

    chartContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6C5CE7" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#6C5CE7" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        ${gridLines}

        <!-- Gradient Area Fill -->
        <path d="${areaPath}" fill="url(#trendAreaGradient)" />

        <!-- Line Curve -->
        <path d="${curvePath}" fill="none" stroke="#6C5CE7" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- X Axis Labels -->
        ${xLabels}

        <!-- Hover Data Dots -->
        ${dots}
      </svg>
    `;
  }

  // Initial render
  renderChart(dataset7Days);

  // Period selector toggle
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      if (e.target.value === '30') {
        renderChart(dataset30Days);
        MindSenseToast.show('Switched to 30-day monitoring trend view', 'info');
      } else {
        renderChart(dataset7Days);
        MindSenseToast.show('Switched to 7-day monitoring trend view', 'info');
      }
    });
  }
}

/* ==========================================================================
   3. IOT LIVE SENSOR SIMULATION & MODAL
   ========================================================================== */
function initIoTLiveTelemetry() {
  const hrEl = document.getElementById('dash-iot-hr');
  const tempEl = document.getElementById('dash-iot-temp');
  const activityEl = document.getElementById('dash-iot-activity');
  const sleepEl = document.getElementById('dash-iot-sleep');
  const syncTimeEl = document.getElementById('dash-iot-sync-time');

  // Subtle live variance every 4 seconds
  setInterval(() => {
    const iot = MindSenseState.get(STORAGE_KEYS.IOT);
    if (iot && iot.metrics) {
      const hr = 76 + Math.floor(Math.random() * 5);
      if (hrEl) hrEl.textContent = `${hr} BPM`;
      if (tempEl) tempEl.textContent = `${iot.metrics.temperature} °C`;
      if (activityEl) activityEl.textContent = iot.metrics.activity;
      if (sleepEl) sleepEl.textContent = iot.metrics.sleepDuration;
      if (syncTimeEl) {
        syncTimeEl.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
  }, 4000);
}

/* ==========================================================================
   4. MODALS & MOBILE SIDEBAR DRAWER
   ========================================================================== */
function initModalsAndDrawers() {
  // Mobile Sidebar Toggle
  const menuToggleBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('main-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuToggleBtn && sidebar && overlay) {
    menuToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  // IoT Diagnostics Modal
  const viewIotBtn = document.getElementById('view-iot-details-btn');
  const iotModal = document.getElementById('iot-details-modal');
  const closeIotModalBtn = document.getElementById('close-iot-modal-btn');

  if (viewIotBtn && iotModal) {
    viewIotBtn.addEventListener('click', () => {
      iotModal.classList.add('active');
    });
  }

  if (closeIotModalBtn && iotModal) {
    closeIotModalBtn.addEventListener('click', () => {
      iotModal.classList.remove('active');
    });
  }

  // AI Insight Details Modal
  const viewInsightBtn = document.getElementById('view-insight-details-btn');
  const insightModal = document.getElementById('ai-insight-modal');
  const closeInsightModalBtn = document.getElementById('close-insight-modal-btn');

  if (viewInsightBtn && insightModal) {
    viewInsightBtn.addEventListener('click', () => {
      insightModal.classList.add('active');
    });
  }

  if (closeInsightModalBtn && insightModal) {
    closeInsightModalBtn.addEventListener('click', () => {
      insightModal.classList.remove('active');
    });
  }

  // Close modals on clicking backdrop
  document.querySelectorAll('.mindsense-modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

/* ==========================================================================
   5. NOTIFICATIONS CENTER
   ========================================================================== */
function initNotificationsCenter() {
  const notifBtn = document.getElementById('notification-bell-trigger');
  const notifDropdown = document.getElementById('notifications-dropdown-menu');
  const markReadBtn = document.getElementById('mark-all-read-btn');
  const notifBadge = document.getElementById('notif-badge-counter');

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('active');
      }
    });
  }

  if (markReadBtn && notifBadge) {
    markReadBtn.addEventListener('click', () => {
      notifBadge.style.display = 'none';
      MindSenseToast.show('All notifications marked as read', 'info');
    });
  }
}

/* ==========================================================================
   6. LOGOUT HANDLER
   ========================================================================== */
function initLogoutHandler() {
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      MindSenseAuth.logout();
    });
  }
}
