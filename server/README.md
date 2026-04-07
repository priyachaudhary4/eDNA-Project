# ⚙️ BioScope Backend: Biodiversity Intelligence Engine

This is the FastAPI-powered backend for the **BioScope eDNA Monitoring System**. It handles genomic data processing, biodiversity index calculations, and automated alerting.

---

## 🧠 Intelligence Engine
The core of the server is the `BiodiversityEngine` (located in `/services/bio_engine.py`), which implements:
*   **Shannon-Wiener Index ($\textit{H'}$)**: Quantifying species diversity and evenness.
*   **Simpson Index ($\textit{D}$)**: Measuring the probability of species dominance.
*   **Taxonomic Mapping**: Parsing genomic manifests into structured biological entities.

---

## 🚀 Getting Started

### **1. Virtual Environment (Recommended)**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### **2. Installation**
```bash
pip install -r requirements.txt
```

### **3. Database Setup**
BioScope uses a localized SQLite database for research data persistence.
```bash
python seed.py          # Populates the database with initial study data
```

### **4. Launch the API**
```bash
python main.py
```
The API will be available at [http://localhost:8000](http://localhost:8000). You can explore the interactive API documentation at `/docs`.

---

## 📡 API Endpoints Overview

*   **GET `/api/metrics`**: Retrieves system-wide biodiversity indices.
*   **GET `/api/species`**: Searchable taxonomy results.
*   **POST `/api/upload`**: Ingests genomic files and triggers analysis cycles.
*   **GET `/api/alerts`**: Active critical biodiversity notifications.

---

## 🛠️ Tech Stack
*   **FastAPI**: High-performance asynchronous API framework.
*   **SQLAlchemy**: Modern SQL toolkit and Object Relational Mapper.
*   **Pydantic**: Data validation and settings management.
*   **Pandas**: Robust data manipulation for genomic manifest parsing.
