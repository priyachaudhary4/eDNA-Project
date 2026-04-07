
# 🧬 BioScope: AI-Based DNA Biodiversity Monitoring System

**BioScope** is a high-performance research platform designed for modern ecological monitoring. By leveraging environmental DNA (eDNA) analysis and AI-driven metrics, it allows scientists and environmental authorities to monitor biodiversity, identify rare species, and detect invasive threats in real-time.

---

## 🌟 Project Overview
Traditional biodiversity monitoring is often slow and invasive. **BioScope** revolutionizes this by using genomic data collected from simple water, soil, or air samples. Our system parses complex DNA manifests and applies advanced ecological algorithms to provide a digital snapshot of ecosystem health.

---

## 🏗️ Major Modules

### 1. **Biodiversity Dashboard (Hub)**
An interactive command center for real-time ecological insights.
*   **Metrics**: Displays Shannon-Wiener Diversity ($\textit{H'}$) and Simpson's Index ($\textit{D}$).
*   **Trends**: Visualizes species richness across different habitats (Mangroves, Forests, Freshwater).
*   **Alerts**: Real-time ticker for endangered or invasive species identifications.

### 2. **Genomic Engine & Data Pipeline**
The backend processing unit that handles biological data ingestion.
*   **Uploads**: Supports CSV, FASTA, and FASTQ genomic manifests.
*   **Processing**: Automated data normalization and taxonomic classification.
*   **Job Management**: Tracks simulation and real identification jobs with progress monitoring.

### 3. **Geospatial Intelligence (GIS Map)**
A visual-spatial module mapping biological occurrences to the real world.
*   **Live Markers**: Clusters findings by geographic region (National Parks, Coastal Zones).
*   **Heatmaps**: Visualizes species concentration and distribution patterns.
*   **Habitat Filtering**: Allows researchers to isolate data based on environment types.

### 4. **Taxonomy & Species Inquiry**
A searchable digital library of all biological entities detected by the system.
*   **Profiles**: Detailed cards for each species including scientific names, behavior, and diet.
*   **Conservation Status**: Categorizes findings into *Endangered*, *Invasive*, or *Native Flora/Fauna*.
*   **Search**: High-speed filtering by genus, family, or common name.

---

## 🛠️ Technical Architecture

### **Frontend (Client)**
*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Lucide React](https://lucide.dev/) & Framer Motion
*   **Data Visualization**: [Recharts](https://recharts.org/) & [Leaflet.js](https://leafletjs.com/)

### **Backend (Server)**
*   **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database**: SQLAlchemy ORM with SQLite (Research-Grade)
*   **Analysis Engine**: Custom Python services for calculating biodiversity indices ($\textit{H', D, E}$).

---

## 🚀 Local Installation & Setup

### **1. Prerequisites**
*   **Node.js**: v18.x or higher
*   **Python**: v3.9 or higher

### **2. Server Initialization**
Navigate to the `/server` directory:
```bash
pip install -r requirements.txt
python seed.py          # Populates the database with initial research data
python main.py          # Starts the API server (http://localhost:8000)
```

### **3. Client Initialization**
Navigate to the `/client` directory:
```bash
npm install             # Install dependencies (First time only)
npm run dev             # Start the development UI (http://localhost:5173)
```

---

## 📊 Evaluation Metrics
The system evaluates ecosystem health using three primary scientific indices:
1.  **Species Richness**: The total number of unique species in a defined area.
2.  **Shannon Index ($H'$)**: Measures uncertainty to determine diversity and evenness.
3.  **Simpson’s Index ($D$)**: Measures the probability that two randomly selected individuals belong to the same species.

---

## 🛡️ Future Enhancements
*   **Field-to-Cloud API**: Direct integration with portable DNA sequencers (e.g., MinION).
*   **AI Predictor**: Predictive modeling for invasive species spread based on climate data.
*   **Blockchain for Data Integrity**: Immutable logging of research findings for environmental audits.
