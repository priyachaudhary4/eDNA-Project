@echo off
echo ======================================================
echo 🧬 Starting eDNA Biodiversity AI Integrated System...
echo ======================================================

:: 1. Start Streamlit AI Dashboard (Port 8501)
echo [1/3] Launching AI Intelligence Layer (Streamlit)...
start "AI_INTELLIGENCE" /D "c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA (2)\eDNA\server\services\Biodiversity_AI_Integrated" streamlit run app.py --server.port 8501 --server.headless true

:: 2. Start FastAPI Backend (Port 8000)
echo [2/3] Launching BioScope Backend (FastAPI)...
start "BIOSCOPE_BACKEND" /D "c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA (2)\eDNA\server" python main.py

:: 3. Start React Frontend (Port 5173)
echo [3/3] Launching BioScope Frontend (Vite)...
cd "c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA (2)\eDNA\client"
npm run dev

echo ======================================================
echo ✅ All systems initializing. 
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:8000
echo - AI Layer: http://localhost:8501
echo ======================================================
pause
