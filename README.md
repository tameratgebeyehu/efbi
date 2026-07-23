# 🇪🇹 Ethiopian Future Builders Initiative (EFBI)

> **Empowering Ethiopia's Next Generation of Technology Builders, Software Engineers, and Innovation Catalysts.**

[![Live Platform](https://img.shields.io/badge/Live_Platform-EFBI_Initiative-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://tameratgebeyehu.github.io/efbi/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Cohort_2026_Active-3b82f6?style=for-the-badge)](https://tameratgebeyehu.github.io/efbi/#register)

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
  - [🎓 Immersive Learning Portal](#-immersive-learning-portal)
  - [⚡ Focus-Mode Quiz Engine](#-focus-mode-quiz-engine)
  - [📊 Student & Certificate Dashboard](#-student--certificate-dashboard)
  - [🛡️ Admin Back-Office Management](#️-admin-back-office-management)
  - [🔍 Public Certificate Verification](#-public-certificate-verification)
  - [🌓 Adaptive Dual-Theme System](#-adaptive-dual-theme-system)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [File Structure](#-file-structure)
- [Getting Started](#-getting-started)
- [Backend & Database (Google Apps Script)](#-backend--database-google-apps-script)
- [License](#-license)

---

## 🌟 Overview

The **Ethiopian Future Builders Initiative (EFBI)** is a state-of-the-art educational platform designed to equip Ethiopian youth with world-class technical skills in Artificial Intelligence, Software Engineering, Web/Mobile App Development, Entrepreneurship, and Leadership.

Built as a lightweight, zero-dependency, ultra-fast Single Page Application (SPA), EFBI delivers a Coursera-grade learning experience tailored specifically to regional needs, featuring distraction-free video lectures, instant practice assessments, verified digital credentials, and administrative controls.

---

## ✨ Key Features

### 🎓 Immersive Learning Portal
- **YouTube IFrame API Engine**: Complete masking of native YouTube UI/branding (no external video distraction or channel leaks).
- **Custom Player Controls**: Custom seek bar, play/pause, skip $\pm 10\text{s}$, volume slider, fullscreen toggle, and playback speed selector ($0.5\times \rightarrow 2\times$).
- **Interactive Gestures & Shortcuts**: Mouse-wheel volume adjustments, keybindings (`Space` for Play/Pause, `J`/`L` for seeking, `M` for mute, `F` for fullscreen, `↑`/`↓` for volume).
- **Tabbed Lesson View**: Seamless switching between **Overview**, **Instructor Notes**, **Resource Attachments**, and **Practice Quizzes**.

### ⚡ Focus-Mode Quiz Engine
- **Distraction-Free Modal**: Ambient Ethiopian-inspired background lighting with zero interface clutter.
- **Real-Time Timer**: Live counter tracking assessment duration with automatic status alerts.
- **Instant Answer Diagnostics**: Visual answer verification with green/red indicator glows and explanatory feedback banners.
- **Animated SVG Score Ring & Celebration**: Dynamic score calculation with confetti bursts on passing ($\ge 70\%$).
- **Keyboard Navigation**: Press `1`-`4` for options, `Enter` to confirm, `Esc` to close, and `R` to retry.

### 📊 Student & Certificate Dashboard
- **Visual Progress Ring**: Live SVG ring tracking course progress percentage.
- **Stat Chips**: Quick insights showing completed lessons, remaining modules, and active streaks.
- **Lesson Resume Engine**: Auto-detects the last uncompleted module to resume learning in one click.
- **Digital Certificate Generation**: Instantly unlocks verifiable completion certificates upon $100\%$ course progress.

### 🛡️ Admin Back-Office Management
- **Analytics Overview**: Dynamic Chart.js visualizations for student registration trends and course enrollments.
- **Student Directory**: Inspect student details, track individual module progress, and manage cohorts.
- **Course Manager**: Publish, update, or unpublish courses; changes instantly auto-reflect across registration pathways and catalog feeds.
- **CSV Data Export**: Export student lists and contact submissions in one click.

### 🔍 Public Certificate Verification
- **Unique Credential ID System**: Instant online verification at `#verify/<CERT_ID>`.
- **Authenticity Seal**: Displays student name, issued course pathway, completion date, and official EFBI security seal.

### 🌓 Adaptive Dual-Theme System
- **Ethiopian Dark Glassmorphism**: Premium deep indigo/slate palette inspired by modern tech aesthetics.
- **Clean Light Mode**: High-contrast, polished light theme for daylight studying.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Core** | HTML5, Modern Vanilla CSS3 (Custom Design Tokens, Flexbox, CSS Grid) |
| **Logic & Router** | Vanilla JavaScript (ES6+ SPA, Hash-based Routing, Dynamic DOM Rendering) |
| **Icons** | [Lucide Icons](https://lucide.dev/) |
| **Data Visualization** | [Chart.js](https://www.chartjs.org/) |
| **Media Player** | YouTube IFrame Player API |
| **Backend API** | Google Apps Script (Serverless Web App API) |
| **Database** | Google Sheets / EFBIDatabase RPC Connector |
| **Hosting** | GitHub Pages |

---

## 📁 File Structure

```text
Ethiopian Future Builders Initiative/
├── index.html              # Main SPA HTML entry point & view templates
├── styles.css              # Universal design system, glassmorphism & themes
├── app.js                  # SPA routing, learning portal, quiz & admin logic
├── api.js                  # EFBIDatabase API wrapper & RPC client
├── google_apps_script.js   # Serverless Google Apps Script backend script
├── assets/                 # Brand images, illustrations & graphics
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Local Development
Since EFBI is built with native web technologies, no build process or node dependencies are required!

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/tameratgebeyehu/efbi.git
   cd efbi
   ```

2. **Run a Local Server**:
   You can open `index.html` directly in your browser or use Python's built-in HTTP server:
   ```bash
   python -m http.server 8000
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:8000`.

---

## 🔌 Backend & Database (Google Apps Script)

The application communicates with a serverless backend hosted on Google Apps Script via `api.js`.

### Supported RPC Endpoints:
- `getStudents` / `registerStudent` / `studentLogin`
- `getCourses` / `saveCourse` / `deleteCourse`
- `getProgress` / `saveProgress`
- `getQuizScores` / `saveQuizScore`
- `getCertificates` / `verifyCertificate`
- `sendContactMessage` / `getContactMessages`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p center="align">
  <b>Built with ❤️ for the youth of Ethiopia 🇪🇹</b><br>
  <i>Ethiopian Future Builders Initiative (EFBI) © 2026. All Rights Reserved.</i>
</p>
