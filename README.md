---
title: eDNA-Biodiversity-AI1
emoji: 🧬
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# 🧬 BioScope: AI-Based DNA Biodiversity Monitoring System

**BioScope** is a high-performance research platform designed for modern ecological monitoring. By leveraging environmental DNA (eDNA) analysis and AI-driven metrics, it allows scientists to monitor biodiversity, identify rare species, and detect invasive threats in real-time.

---

## 🌟 Visual Overview

### 📊 Main Intelligence Dashboard
Real-time monitoring of global hotspots and ecosystem health, featuring live metrics for total detections, endangered species, and diversity indices.
![BioScope Dashboard](docs/screenshots/dashboard.png)

### 🧬 Biological Profiling (Neural Engine)
Advanced genomic identification powered by **DNABERT-2**, enabling high-fidelity zero-shot similarity matching against global species databases.
![Biological Profiling](docs/screenshots/profiling.png)

---

## 🏗️ Major Modules

### 1. **Biodiversity Dashboard (Hub)**
An interactive command center for real-time ecological insights.
*   **Metrics**: Displays Shannon-Wiener Diversity ($\textit{H'}$) and Simpson's Index ($\textit{D}$).
*   **Trends**: Visualizes species richness across different habitats.
*   **Alerts**: Real-time ticker for endangered or invasive species identifications.

### 2. **Biological Profiling (AI Engine)**
The core intelligence layer for genomic identification.
*   **Neural Backbone**: Uses **DNABERT-2 (117M)** transformer architecture for DNA sequence embedding.
*   **Zero-shot similarity**: Compares uploaded eDNA samples against a global taxonomic database.
*   **Automated Research**: Direct integration with Wikipedia APIs for real-time profiling of detected species.

### 3. **Geospatial Intelligence (GIS Map)**
A visual-spatial module mapping biological occurrences to the real world.
*   **Live Markers**: Clusters findings by geographic region.
*   **Heatmaps**: Visualizes species concentration and distribution patterns.

---

## 🛠️ Technical Architecture

### **AI Layer (Streamlit)**
*   **Models**: DNABERT-2 (Zhihan1996) + Scikit-Learn KNN Classifier
*   **Compute**: PyTorch + Transformers + Einops
*   **Integration**: Seamlessly embedded as a microservice in the main React application.

### **Frontend (React)**
*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Lucide React](https://lucide.dev/) & Framer Motion

---

## 🚀 Installation & Running

For a fully integrated experience, we recommend using our master startup script:

### **One-Click Run (Recommended)**
1.  Navigate to the project root.
2.  Double-click `run_integrated.bat`.
    *   This will automatically start the **AI Service** (8501), **API Backend** (8000), and **Frontend UI** (5173) in sync.

### **Manual Start (Separate)**
1.  **AI Engine**: `cd server/services/Biodiversity_AI_Integrated` -> `streamlit run app.py`
2.  **API Backend**: `cd server` -> `python main.py`
3.  **Frontend UI**: `cd client` -> `npm run dev`

---

## 🛡️ Future Enhancements
*   **MinION Integration**: Direct live-feed from portable DNA sequencers.
*   **Predictive AI**: Forecasting invasive species spread using climate-risk modeling.
*   **Citizen Science Hub**: Allowing public researchers to contribute to the global eDNA database.
