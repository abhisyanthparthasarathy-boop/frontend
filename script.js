/**
 * =============================================================================
 * SPECULUM — Media Authenticity Intelligence
 * Frontend Application Logic & Backend Integration Architecture
 * =============================================================================
 */

'use strict';

// -----------------------------------------------------------------------------
// 1. BACKEND INTEGRATION CONFIGURATION & STATE
// -----------------------------------------------------------------------------
/**
 * BACKEND INTEGRATION CONFIGURATION
 * 
 * Hackathon participant: To link your real deepfake / audio spoof detection model:
 * 1. Set `isConnected: true`
 * 2. Set `baseUrl: 'http://localhost:8000'` (or your server URL)
 * 3. Verify the endpoints match your FastAPI / Flask routing
 */
const API_CONFIG = {
  baseUrl: 'http://localhost:8000', // e.g. FastAPI / Flask / Node backend
  isConnected: false,               // Set to true when your model service is active
  endpoints: {
    video: '/api/detect/video',
    audio: '/api/detect/audio',
    health: '/api/health'
  }
};

// Application State
const state = {
  currentFile: null,
  detectedMediaType: null, // 'video' | 'audio' | null
  isAnalyzing: false,
  stats: {
    reviewed: 0,
    authentic: 0,
    manipulated: 0
  },
  reports: []
};

// Supported file extensions
const SUPPORTED_VIDEO_EXT = ['mp4', 'mov', 'avi', 'webm'];
const SUPPORTED_AUDIO_EXT = ['wav', 'mp3', 'm4a', 'aac'];

// -----------------------------------------------------------------------------
// 2. DOM ELEMENT REFERENCES
// -----------------------------------------------------------------------------
const elements = {
  // Theme Toggle
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabel: document.getElementById('themeLabel'),

  // Upload & File Drop Zone
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  browseBtn: document.getElementById('browseBtn'),
  dropZoneContent: document.getElementById('dropZoneContent'),
  selectedFileCard: document.getElementById('selectedFileCard'),
  fileNameDisplay: document.getElementById('fileNameDisplay'),
  fileTypeBadge: document.getElementById('fileTypeBadge'),
  fileSizeDisplay: document.getElementById('fileSizeDisplay'),
  fileIconWrapper: document.getElementById('fileIconWrapper'),
  removeFileBtn: document.getElementById('removeFileBtn'),

  // Error Banner
  errorBanner: document.getElementById('errorBanner'),
  errorTitle: document.getElementById('errorTitle'),
  errorMessage: document.getElementById('errorMessage'),
  dismissErrorBtn: document.getElementById('dismissErrorBtn'),

  // Action Buttons
  analyzeVideoBtn: document.getElementById('analyzeVideoBtn'),
  analyzeAudioBtn: document.getElementById('analyzeAudioBtn'),

  // Detector Status Elements
  systemStatusDot: document.getElementById('systemStatusDot'),
  systemStatusText: document.getElementById('systemStatusText'),
  videoDetectorBadge: document.getElementById('videoDetectorBadge'),
  audioDetectorBadge: document.getElementById('audioDetectorBadge'),
  videoDetectorEndpoint: document.getElementById('videoDetectorEndpoint'),
  audioDetectorEndpoint: document.getElementById('audioDetectorEndpoint'),

  // Results Panel Elements
  resultPanel: document.getElementById('resultPanel'),
  resultDisconnectedState: document.getElementById('resultDisconnectedState'),
  resultLoadingState: document.getElementById('resultLoadingState'),
  loadingStateDesc: document.getElementById('loadingStateDesc'),
  resultFileName: document.getElementById('resultFileName'),
  resultAnalysisStatus: document.getElementById('resultAnalysisStatus'),
  resultClassification: document.getElementById('resultClassification'),
  resultConfidence: document.getElementById('resultConfidence'),
  resultExplanation: document.getElementById('resultExplanation'),

  // Statistics
  statReviewedCount: document.getElementById('statReviewedCount'),
  statAuthenticCount: document.getElementById('statAuthenticCount'),
  statManipulatedCount: document.getElementById('statManipulatedCount'),

  // Reports
  reportsEmptyState: document.getElementById('reportsEmptyState'),
  reportsTableContainer: document.getElementById('reportsTableContainer'),
  reportsTableBody: document.getElementById('reportsTableBody'),

  // Guide Drawer
  toggleGuideBtn: document.getElementById('toggleGuideBtn'),
  guideBody: document.getElementById('guideBody'),
  guideArrow: document.getElementById('guideArrow'),
  guideToggleText: document.getElementById('guideToggleText')
};

// -----------------------------------------------------------------------------
// 3. THEME TOGGLE (LIGHT / DARK EDITORIAL SYSTEM)
// -----------------------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('speculum_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  elements.themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('speculum_theme', theme);

  if (theme === 'dark') {
    elements.themeLabel.textContent = 'Light Mode';
    elements.themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
  } else {
    elements.themeLabel.textContent = 'Dark Mode';
    elements.themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
  }
}

// -----------------------------------------------------------------------------
// 4. FILE VALIDATION & SELECTION HANDLING
// -----------------------------------------------------------------------------
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

function validateAndSelectFile(file) {
  hideError();

  if (!file) return;

  const ext = getFileExtension(file.name);
  const isVideo = SUPPORTED_VIDEO_EXT.includes(ext);
  const isAudio = SUPPORTED_AUDIO_EXT.includes(ext);

  if (!isVideo && !isAudio) {
    showError(
      'Unsupported File Container',
      `"${file.name}" is not a supported video or audio format. Please provide one of: MP4, MOV, AVI, WEBM, WAV, MP3, M4A, or AAC.`
    );
    clearSelectedFile();
    return;
  }

  // Store valid file in state
  state.currentFile = file;
  state.detectedMediaType = isVideo ? 'video' : 'audio';

  // Update UI Preview
  elements.fileNameDisplay.textContent = file.name;
  elements.fileSizeDisplay.textContent = formatFileSize(file.size);
  elements.fileTypeBadge.textContent = isVideo 
    ? `Video (${ext.toUpperCase()})` 
    : `Audio (${ext.toUpperCase()})`;

  // Render correct SVG icon
  if (isVideo) {
    elements.fileIconWrapper.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
      </svg>
    `;
  } else {
    elements.fileIconWrapper.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    `;
  }

  // Toggle card visibility
  elements.dropZoneContent.classList.add('hidden');
  elements.selectedFileCard.classList.remove('hidden');

  // Enable analysis buttons
  elements.analyzeVideoBtn.disabled = false;
  elements.analyzeAudioBtn.disabled = false;

  // Update Result panel preview info
  elements.resultFileName.textContent = file.name;
}

function clearSelectedFile() {
  state.currentFile = null;
  state.detectedMediaType = null;
  elements.fileInput.value = '';

  elements.selectedFileCard.classList.add('hidden');
  elements.dropZoneContent.classList.remove('hidden');

  elements.analyzeVideoBtn.disabled = true;
  elements.analyzeAudioBtn.disabled = true;

  // Reset file name in results panel if not currently displaying verified results
  if (state.reports.length === 0) {
    elements.resultFileName.textContent = 'No file analyzed';
  }
}

function showError(title, message) {
  elements.errorTitle.textContent = title;
  elements.errorMessage.textContent = message;
  elements.errorBanner.classList.remove('hidden');
}

function hideError() {
  elements.errorBanner.classList.add('hidden');
}

// -----------------------------------------------------------------------------
// 5. DRAG & DROP AND FILE SELECTION LISTENERS
// -----------------------------------------------------------------------------
function initUploadInteractions() {
  // Trigger file picker from browse button
  elements.browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.fileInput.click();
  });

  // Clicking drop zone triggers input if no file selected
  elements.dropZone.addEventListener('click', () => {
    if (!state.currentFile) {
      elements.fileInput.click();
    }
  });

  // Accessible keyboard activation (Enter or Space)
  elements.dropZone.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !state.currentFile) {
      e.preventDefault();
      elements.fileInput.click();
    }
  });

  // Native input change
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  });

  // Remove file button
  elements.removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  // Dismiss error button
  elements.dismissErrorBtn.addEventListener('click', () => {
    hideError();
  });

  // Drag and Drop visual feedback
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('dragover');
    });
  });

  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');

    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      validateAndSelectFile(dt.files[0]);
    }
  });
}

// -----------------------------------------------------------------------------
// 6. DETECTOR ACTIONS & PIPELINE ROUTING
// -----------------------------------------------------------------------------
function initActionButtons() {
  elements.analyzeVideoBtn.addEventListener('click', () => {
    handleAnalysisRequest('video');
  });

  elements.analyzeAudioBtn.addEventListener('click', () => {
    handleAnalysisRequest('audio');
  });
}

function handleAnalysisRequest(requestedPipeline) {
  hideError();

  if (!state.currentFile) {
    showError('No Media File Selected', 'Please upload a video or audio file first.');
    return;
  }

  // Cross-modal mismatch validation
  if (requestedPipeline === 'video' && state.detectedMediaType === 'audio') {
    showError(
      'Modality Mismatch',
      `The selected file "${state.currentFile.name}" is an audio track. Please click "Analyze Audio" or upload a video container (MP4, MOV, AVI, WEBM).`
    );
    return;
  }

  if (requestedPipeline === 'audio' && state.detectedMediaType === 'video') {
    showError(
      'Modality Mismatch',
      `The selected file "${state.currentFile.name}" is a video asset. Please click "Analyze Video" or upload an audio file (WAV, MP3, M4A, AAC).`
    );
    return;
  }

  // Execute pipeline inspection
  executeForensicAnalysis(state.currentFile, requestedPipeline);
}

// -----------------------------------------------------------------------------
// 7. BACKEND INTEGRATION HOOK & ANALYSIS PIPELINE
// -----------------------------------------------------------------------------
/**
 * CORE BACKEND INTEGRATION FUNCTION
 * 
 * This function handles the real connection to your detection backend.
 * Until API_CONFIG.isConnected is set to true, it safely halts without
 * generating any mock scores or hallucinated deepfake verdicts.
 * 
 * @param {File} file - The uploaded video or audio File object
 * @param {string} mediaType - 'video' or 'audio'
 * @returns {Promise<Object>} Detection results from your model
 */
async function analyzeMediaWithBackend(file, mediaType) {
  // If backend connection is not configured, inform the caller
  if (!API_CONFIG.isConnected) {
    return {
      connected: false,
      message: 'Detection model not connected.'
    };
  }

  // PREPARED FETCH IMPLEMENTATION FOR REAL BACKEND:
  const endpoint = mediaType === 'video'
    ? `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.video}`
    : `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.audio}`;

  const formData = new FormData();
  formData.append('media_file', file);
  formData.append('media_type', mediaType);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Inference server responded with HTTP status ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Executes forensic analysis flow:
 * Handles loading states, checks connection, and updates UI safely.
 */
async function executeForensicAnalysis(file, mediaType) {
  state.isAnalyzing = true;
  setLoadingState(true, `Routing ${file.name} to ${mediaType === 'video' ? 'Video Deepfake' : 'Audio Spoof'} detector...`);

  try {
    const result = await analyzeMediaWithBackend(file, mediaType);

    if (!result.connected) {
      // BACKEND NOT CONNECTED STATE
      // Strictly maintain journalistic truth: Never generate fake scores or random verdicts!
      displayModelDisconnectedResult(file);
      showError(
        'Detection Model Not Connected',
        `Cannot analyze "${file.name}" because the ${mediaType === 'video' ? 'Video' : 'Audio'} detection model is offline. SPECULUM does not generate random scores or synthetic verdicts. Connect your backend service to continue.`
      );
    } else {
      // REAL BACKEND RESPONSE RECEIVED
      displayModelSuccessResult(file, result, mediaType);
      recordSessionReport(file, result, mediaType);
    }
  } catch (err) {
    console.error('Forensic analysis error:', err);
    displayModelDisconnectedResult(file);
    showError(
      'Model Inference Error',
      `Failed to communicate with detection endpoint: ${err.message}. Ensure your backend server is running.`
    );
  } finally {
    setLoadingState(false);
    state.isAnalyzing = false;
  }
}

// -----------------------------------------------------------------------------
// 8. RESULTS PANEL RENDERERS
// -----------------------------------------------------------------------------
function setLoadingState(isLoading, message = '') {
  if (isLoading) {
    elements.resultDisconnectedState.classList.add('hidden');
    elements.resultLoadingState.classList.remove('hidden');
    elements.loadingStateDesc.textContent = message;
    elements.analyzeVideoBtn.disabled = true;
    elements.analyzeAudioBtn.disabled = true;
  } else {
    elements.resultLoadingState.classList.add('hidden');
    elements.analyzeVideoBtn.disabled = !state.currentFile;
    elements.analyzeAudioBtn.disabled = !state.currentFile;
  }
}

/**
 * Displayed when no backend model is active.
 * Guarantees zero fake verdicts or simulated statistics.
 */
function displayModelDisconnectedResult(file) {
  elements.resultDisconnectedState.classList.remove('hidden');

  elements.resultFileName.textContent = file ? file.name : 'No file analyzed';
  
  elements.resultAnalysisStatus.innerHTML = `
    <span class="tag-status tag-standby">Detection model not connected</span>
  `;

  elements.resultClassification.innerHTML = `
    <span class="tag-status tag-unverified">Awaiting backend connection</span>
  `;

  elements.resultConfidence.textContent = 'N/A (model disconnected)';

  elements.resultExplanation.innerHTML = `
    <strong>Forensic Model Offline:</strong> Neither the video detector nor audio spoof classifier is online. 
    Per ethical guidelines, SPECULUM refuses to display simulated percentages or random AI verdicts. 
    Connect your model endpoint in <code>script.js</code> via <code>analyzeMediaWithBackend()</code> to render genuine forensic telemetry.
  `;
}

/**
 * Displayed strictly when genuine backend model data is returned.
 */
function displayModelSuccessResult(file, data, mediaType) {
  elements.resultDisconnectedState.classList.remove('hidden');

  elements.resultFileName.textContent = file.name;
  
  elements.resultAnalysisStatus.innerHTML = `
    <span class="tag-status tag-authentic">Analysis Complete</span>
  `;

  const isLikelyAuthentic = (data.classification || '').toLowerCase().includes('authentic');

  elements.resultClassification.innerHTML = isLikelyAuthentic
    ? `<span class="tag-status tag-authentic">${escapeHtml(data.classification)}</span>`
    : `<span class="tag-status tag-manipulated">${escapeHtml(data.classification)}</span>`;

  // Format real confidence from actual model (e.g. 0.942 -> 94.2%)
  const confidencePercent = typeof data.confidence === 'number'
    ? `${(data.confidence * 100).toFixed(1)}%`
    : (data.confidence || 'Not provided');

  elements.resultConfidence.textContent = confidencePercent;

  elements.resultExplanation.innerHTML = `
    <strong>Model Rationale:</strong> ${escapeHtml(data.explanation || 'No forensic explanation provided by model.')}
  `;
}

// -----------------------------------------------------------------------------
// 9. SESSION STATISTICS & RECENT REPORTS
// -----------------------------------------------------------------------------
function recordSessionReport(file, modelResult, mediaType) {
  // Update Session Statistics ONLY from genuine model results
  state.stats.reviewed += 1;

  const isAuthentic = (modelResult.classification || '').toLowerCase().includes('authentic');
  if (isAuthentic) {
    state.stats.authentic += 1;
  } else {
    state.stats.manipulated += 1;
  }

  // Update DOM stats
  elements.statReviewedCount.textContent = state.stats.reviewed;
  elements.statAuthenticCount.textContent = state.stats.authentic;
  elements.statManipulatedCount.textContent = state.stats.manipulated;

  // Append to Recent Reports
  const reportItem = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    fileName: file.name,
    mediaType: mediaType.toUpperCase(),
    classification: modelResult.classification,
    confidence: typeof modelResult.confidence === 'number' 
      ? `${(modelResult.confidence * 100).toFixed(1)}%` 
      : modelResult.confidence,
    isAuthentic: isAuthentic
  };

  state.reports.unshift(reportItem);
  renderRecentReports();
}

function renderRecentReports() {
  if (state.reports.length === 0) {
    elements.reportsEmptyState.classList.remove('hidden');
    elements.reportsTableContainer.classList.add('hidden');
    return;
  }

  elements.reportsEmptyState.classList.add('hidden');
  elements.reportsTableContainer.classList.remove('hidden');

  elements.reportsTableBody.innerHTML = state.reports.map(report => `
    <tr>
      <td class="mono">${escapeHtml(report.timestamp)}</td>
      <td><strong>${escapeHtml(report.fileName)}</strong></td>
      <td><span class="format-pill">${escapeHtml(report.mediaType)}</span></td>
      <td>
        <span class="tag-status ${report.isAuthentic ? 'tag-authentic' : 'tag-manipulated'}">
          ${escapeHtml(report.classification)}
        </span>
      </td>
      <td class="mono">${escapeHtml(report.confidence)}</td>
      <td>
        <button type="button" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="viewReportDetail(${report.id})">
          Audit View
        </button>
      </td>
    </tr>
  `).join('');
}

// Window helper for report details
window.viewReportDetail = function(reportId) {
  const report = state.reports.find(r => r.id === reportId);
  if (!report) return;
  alert(
    `SPECULUM FORENSIC AUDIT RECORD\n` +
    `-----------------------------------------\n` +
    `File: ${report.fileName}\n` +
    `Pipeline: ${report.mediaType}\n` +
    `Classification: ${report.classification}\n` +
    `Confidence: ${report.confidence}\n` +
    `Timestamp: ${report.timestamp}\n` +
    `Integrity: Verified Model Output`
  );
};

// -----------------------------------------------------------------------------
// 10. DEVELOPER QUICKSTART GUIDE DRAWER
// -----------------------------------------------------------------------------
function initGuideDrawer() {
  elements.toggleGuideBtn.addEventListener('click', () => {
    const isExpanded = elements.toggleGuideBtn.getAttribute('aria-expanded') === 'true';
    elements.toggleGuideBtn.setAttribute('aria-expanded', !isExpanded);
    elements.guideBody.classList.toggle('hidden');
    
    if (!isExpanded) {
      elements.guideToggleText.textContent = 'Hide Integration Code';
      elements.guideArrow.style.transform = 'rotate(180deg)';
    } else {
      elements.guideToggleText.textContent = 'View Integration Code';
      elements.guideArrow.style.transform = 'rotate(0deg)';
    }
  });
}

// -----------------------------------------------------------------------------
// 11. DETECTOR STATUS DISPLAY UPDATE
// -----------------------------------------------------------------------------
function updateDetectorStatusUI() {
  if (API_CONFIG.isConnected) {
    elements.systemStatusDot.className = 'status-dot online';
    elements.systemStatusText.textContent = 'Backend Active';

    elements.videoDetectorBadge.className = 'status-badge status-online';
    elements.videoDetectorBadge.innerHTML = `<span class="badge-dot"></span><span>Online</span>`;
    elements.videoDetectorEndpoint.textContent = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.video}`;

    elements.audioDetectorBadge.className = 'status-badge status-online';
    elements.audioDetectorBadge.innerHTML = `<span class="badge-dot"></span><span>Online</span>`;
    elements.audioDetectorEndpoint.textContent = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.audio}`;
  } else {
    elements.systemStatusDot.className = 'status-dot disconnected';
    elements.systemStatusText.textContent = 'Models Offline';

    elements.videoDetectorBadge.className = 'status-badge status-offline';
    elements.videoDetectorBadge.innerHTML = `<span class="badge-dot"></span><span>Not connected</span>`;
    elements.videoDetectorEndpoint.textContent = 'UNCONFIGURED';

    elements.audioDetectorBadge.className = 'status-badge status-offline';
    elements.audioDetectorBadge.innerHTML = `<span class="badge-dot"></span><span>Not connected</span>`;
    elements.audioDetectorEndpoint.textContent = 'UNCONFIGURED';
  }
}

// -----------------------------------------------------------------------------
// 12. UTILITIES
// -----------------------------------------------------------------------------
function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// -----------------------------------------------------------------------------
// 13. APPLICATION INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUploadInteractions();
  initActionButtons();
  initGuideDrawer();
  updateDetectorStatusUI();
  
  // Set initial default results view
  displayModelDisconnectedResult(null);

  console.log('SPECULUM Frontend Initialized.');
  console.log('To link your model backend, update API_CONFIG in script.js.');
});
