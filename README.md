# SPECULUM — Media Authenticity Intelligence

> **Editorial Media Forensics & Deepfake Detection Workbench**  
> Built for hackathon presentation with HTML5, CSS3, and Vanilla JavaScript.

---

## 🏛️ Overview

**SPECULUM** is a media authenticity intelligence frontend designed to inspect audio and video assets for signs of generative AI manipulation, facial reenactment, voice cloning, and deepfakes.

Designed with an **editorial publication aesthetic** (warm cream, deep forest-green accents, refined serif typography, and rich obsidian dark mode), SPECULUM adheres strictly to **Responsible AI principles**:
- **Zero Mock Verdicts:** Never generates random detection scores or simulated truth claims without an actual backend model.
- **Bi-Modal Architecture:** Dedicated forensic channels for both video deepfakes and synthetic audio spoofs.
- **Auditable Telemetry:** Clear separation between disconnected pipeline standby and genuine inference results.

---

## 🚀 How to Run the Project

Because SPECULUM is built with standard **HTML5, CSS3, and Vanilla JavaScript**, it requires **no npm installs, no node modules, and no build steps**.

### Option 1: Direct Browser Launch (Easiest & Fastest)
1. Open File Explorer to your project folder:  
   `C:\Users\ABHISYANTH\speculum - proejct`
2. **Double-click `index.html`**  
   *(or right-click `index.html` → **Open with** → **Google Chrome**, **Microsoft Edge**, or **Firefox**)*.
3. The dashboard will load instantly!

### Option 2: Using VS Code Live Server
1. Open the project folder in VS Code or your IDE.
2. If you have the **Live Server** extension installed:
   - Right-click `index.html` and choose **"Open with Live Server"**.
3. Live Server will open the project at `http://127.0.0.1:5500`.

### Option 3: Using PowerShell (Simple Local Server)
If you prefer running a local HTTP server from PowerShell:
```powershell
# Open PowerShell in this folder and run:
Start-Process "index.html"
```
Or if Python is installed on your system:
```powershell
python -m http.server 8000
# Then visit http://localhost:8000 in your browser
```

### Option 4: Running within Django
1. Place `index.html` inside your app's `templates/` folder (e.g. `yourapp/templates/index.html` or `templates/index.html`).
2. Place `style.css` and `script.js` inside your `static/` directory (e.g. `yourapp/static/style.css` and `yourapp/static/script.js`).
3. Ensure `'django.contrib.staticfiles'` is in `INSTALLED_APPS` and `STATIC_URL = '/static/'` in `settings.py`.
4. In `views.py`:
   ```python
   from django.shortcuts import render

   def index(request):
       return render(request, 'index.html')
   ```
5. `index.html` already includes `{% load static %}`, `{% csrf_token %}`, `<meta name="csrf-token">`, and `script.js` automatically passes the Django CSRF token with inference requests!

---

## 📁 Project Structure

```
speculum - proejct/
├── index.html       # Django-compatible HTML5 template (with {% load static %}, CSRF, and blocks)
├── style.css        # Editorial styling system, dark/light theme tokens, responsive layouts
├── script.js        # Drag-and-drop, validation, Django CSRF token handling, and backend hooks
└── README.md        # Documentation and backend integration guide
```

---

## ✨ Features Implemented

### 1. Editorial Header
- **Wordmark & Icon:** SPECULUM typography with custom vector brand mark.
- **Subheading:** `MEDIA AUTHENTICITY INTELLIGENCE`.
- **Theme Toggle:** Fully operational Light Mode (warm cream) and Dark Mode (obsidian teal) with `localStorage` memory and system preference detection.
- **Live Pipeline Indicator:** Visual standby dot and connection badge.

### 2. Forensic Hero
- Dignified editorial headline: *"Can You Trust What You See and Hear?"*
- Clear mission statement and forensic badges highlighting multi-modal analysis.

### 3. Media Intake Laboratory (Upload Area)
- **Drag-and-Drop Zone:** Responsive drop zone with animated border feedback on dragover.
- **File Picker:** "Browse Local Files" button and accessible keyboard activation (`Enter` / `Space`).
- **Supported Formats:**
  - **Video:** `MP4`, `MOV`, `AVI`, `WEBM`
  - **Audio:** `WAV`, `MP3`, `M4A`, `AAC`
- **File Preview Card:** Displays file icon (video or audio), filename, format badge, and human-readable file size (KB/MB).
- **Remove File Button:** Easily clear and reset the intake queue.
- **Validation:** Friendly error banners for unsupported file types and modality mismatches (e.g., clicking "Analyze Video" on an audio file).
- **Action Buttons:** Dedicated forest-green buttons for **Analyze Video** and **Analyze Audio**.

### 4. Detector Status Cards
- Separate status telemetry for:
  - **Video Deepfake Detector** (Face synthesis, temporal artifacts)
  - **Audio Spoof Detector** (Spectral vocoder, voice cloning)
- Accurately displays **"Not connected"** until an authentic model endpoint is configured.

### 5. Analysis Results Panel
- Clear, uncompromised states:
  - **Offline State:** Explains that models are disconnected and guarantees no fake verdicts are displayed.
  - **Loading State:** Editorial spinner and status text during inference.
  - **Structured Slots:** Space for Asset Name, Analysis Status, Model Classification, Model Confidence, and Forensic Rationale.

### 6. Session Statistics
- Tracks **Reviewed Files**, **Likely Authentic**, and **Likely Manipulated**.
- Initialized strictly to **0** and advances only upon verified model returns.

### 7. Recent Reports
- Editorial empty state illustration and message explaining audit logs.
- Dynamic audit table ready to display timestamped records when models run.

### 8. Responsible AI Principles
- Prominent disclosure reminding journalists and analysts that automated models are statistical and should not be treated as standalone legal proof.

---

## 🔌 Connecting a Real AI Detection Backend

Connecting your Python (FastAPI / Flask / PyTorch / TensorFlow) backend is straightforward.

Open [script.js](file:///c:/Users/ABHISYANTH/speculum%20-%20proejct/script.js) and look at the top section:

```javascript
const API_CONFIG = {
  baseUrl: 'http://localhost:8000', // Your API host
  isConnected: true,               // Turn to true when your server is running
  endpoints: {
    video: '/api/detect/video',     // Video inference endpoint
    audio: '/api/detect/audio',     // Audio inference endpoint
    health: '/api/health'
  }
};
```

### Expected JSON Response from your Model:
Your backend endpoint should receive the multipart file upload (`media_file`) and return JSON in this format:

```json
{
  "connected": true,
  "status": "success",
  "classification": "Likely Authentic",
  "confidence": 0.945,
  "explanation": "No temporal warping or blending artifacts detected across 320 facial crop frames."
}
```

The frontend will immediately:
1. Render the verified verdict and confidence badge.
2. Increment the session counters (`Reviewed`, `Authentic` or `Manipulated`).
3. Add a timestamped entry to the **Recent Inspection Reports** table.

---

## 🛡️ License & Attribution
Designed for the hackathon media authenticity initiative.
SPECULUM — Media Authenticity Intelligence.
