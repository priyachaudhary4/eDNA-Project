# 🖥️ BioScope Frontend: User Interface & Experience

This is the React-based frontend for the **BioScope eDNA Biodiversity Monitoring System**. It provides a high-fidelity, research-grade dashboard for interacting with ecological data.

---

## 🎨 Design Philosophy
The UI is built with **Rich Aesthetics** in mind:
*   **Vibrant Data Visualization**: Using Recharts for diversity trends and Leaflet for geospatial mapping.
*   **Modern Workspace**: A dark-themed, glassmorphic layout that feels premium and professional.
*   **Responsive Flow**: Fully adaptive sidebar navigation and data-dense tables for research efficiency.

---

## 🚀 Getting Started

### **1. Installation**
From the `/client` directory, install all required dependencies:
```bash
npm install
```

### **2. Development Server**
Launch the Vite development server:
```bash
npm run dev
```
The application will typically be available at [http://localhost:5173/](http://localhost:5173/).

---

## 📂 Core Components & Pages

*   **Dashboard (`/pages/Dashboard.jsx`)**: Comprehensive overview of ecosystem metrics.
*   **GIS Map (`/pages/GISMap.jsx`)**: Interactive biodiversity mapping with regional clustering.
*   **Species Inquiry (`/pages/SpeciesInquiry.jsx`)**: Taxonomic search engine and species profile cards.
*   **Data Upload (`/pages/DataUpload.jsx`)**: Interface for uploading genomic manifests (CSV/FASTA).
*   **Alert Center (`/pages/AlertCenter.jsx`)**: Critical notification system for invasive or endangered species detections.

---

## 🛠️ Tech Stack
*   **React 19**: Standard library for UI components.
*   **Tailwind CSS v4**: Utility-first CSS for custom, high-performance styling.
*   **Lucide React**: Modern iconography specialized for research applications.
*   **Framer Motion**: Smooth micro-animations for state transitions and hover interactions.

---

## 🔗 Connection to Backend
The frontend communicates with the FastAPI backend (running on port 8000 by default) via centralized Axios calls. Ensure the backend is running to see live data on the dashboard.
