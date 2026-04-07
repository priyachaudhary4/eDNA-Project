import os
import csv
import torch
import pandas as pd
import streamlit as st
import time
import requests

# Ensure we can import local modules
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import joblib
try:
    from dna_embedder import load_embedder_and_tokenizer, get_embedding, _resolve_path
except ImportError:
    # Handle case where user might have moved things
    def _resolve_path(p): return p

# Load the project root config path
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_CONFIG_PATH = os.path.join(_SCRIPT_DIR, "config.json")

# ─── UI & PAGE CONFIG ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="🧬 eDNA Biodiversity AI",
    page_icon="🌿",
    layout="wide",
)

# Premium Global Style (Simplified for Clean Iframe Integration)
st.markdown("""
<style>
/* Clean dark integration */
body, .stApp {
    background: transparent !important;
    color: #f8fafc !important;
}
.stMetric {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    padding: 1rem !important;
}
h1, h2, h3 {
    color: #10b981 !important;
    font-weight: 800 !important;
}

/* Image Hover Special Effects */
img {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    border-radius: 12px !important;
    border: 2px solid rgba(16, 185, 129, 0.2) !important;
}
img:hover {
    transform: scale(1.05) rotate(1deg) !important;
    border-color: #10b981 !important;
    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4) !important;
}

/* Custom Wikipedia Button */
.wiki-btn {
    display: inline-block;
    background: #10b981;
    color: white !important;
    padding: 10px 20px;
    border-radius: 8px;
    text-decoration: none !important;
    font-weight: bold;
    margin-top: 10px;
    transition: all 0.3s ease;
}
.wiki-btn:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}
</style>
""", unsafe_allow_html=True)

# ─── CORE LOGIC ──────────────────────────────────────────────────────────────

@st.cache_resource
def get_model_and_database():
    """Load DNABERT-2 and the target species database."""
    import json
    config = {}
    if os.path.exists(_CONFIG_PATH):
        with open(_CONFIG_PATH) as f:
            config = json.load(f)
            
    model_name = config.get("model_name", "DNABERT-2-117M")
    
    with st.spinner(f"Neural Engine Initializing..."):
        embedder, tokenizer, device = load_embedder_and_tokenizer(model_name)
        
        # Load KNN
        _current_dir = os.path.dirname(os.path.abspath(__file__))
        knn_path = os.path.join(_current_dir, "models", "knn_species_classifier.pkl")
        if not os.path.exists(knn_path):
             knn_path = _resolve_path("models/knn_species_classifier.pkl")
        
        if not os.path.exists(knn_path):
            # Try alternate path
            knn_path = _resolve_path("models/knn_model.joblib")
            
        if not os.path.exists(knn_path):
            raise FileNotFoundError(f"Model storage not found. Please verify the 'models' directory.")
            
        knn_model = joblib.load(knn_path)
        species_list = list(knn_model.classes_)
        
        return embedder, tokenizer, config, device, knn_model, species_list

def parse_sequences(file_content, filename):
    """Parse DNA files into (header, sequence) tuples."""
    records = []
    lines = file_content.decode("utf-8").splitlines()
    ext = filename.split(".")[-1].lower()

    if ext == "fasta":
        header, seq_parts = None, []
        for line in lines:
            if line.startswith(">"):
                if header: records.append((header, "".join(seq_parts)))
                header = line[1:].strip(); seq_parts = []
            else: seq_parts.append(line.strip())
        if header: records.append((header, "".join(seq_parts)))
    elif ext == "csv":
        reader = csv.DictReader(lines)
        for i, row in enumerate(reader, 1):
            seq = row.get("sequence", list(row.values())[0]).strip()
            records.append((f"Row_{i}", seq))
    return records

@st.cache_data(show_spinner=False, ttl=3600)
def get_wikipedia_info(species_name: str):
    """Fetch species intelligence from Wikipedia."""
    formatted_name = species_name.replace(" ", "_")
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{formatted_name}"
    headers = {"User-Agent": "BiodiversityAI/1.0"}
    try:
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            return {
                "title": data.get("title", species_name),
                "extract": data.get("extract", "No summary available."),
                "image_url": data.get("thumbnail", {}).get("source", None),
                "wiki_url": f"https://en.wikipedia.org/wiki/{data.get('title', formatted_name)}"
            }
        
        # AI Fallback Search
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={species_name}&format=json&origin=*"
        sr = requests.get(search_url, headers=headers, timeout=5)
        if sr.status_code == 200:
            results = sr.json().get("query", {}).get("search", [])
            if results:
                top = results[0]["title"]
                r2 = requests.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{top.replace(' ', '_')}", headers=headers, timeout=5)
                if r2.status_code == 200:
                    d = r2.json()
                    return {
                        "title": d.get("title", top),
                        "extract": d.get("extract", "No summary available."),
                        "image_url": d.get("thumbnail", {}).get("source", None),
                        "wiki_url": f"https://en.wikipedia.org/wiki/{d.get('title', top).replace(' ', '_')}"
                    }
    except: pass
    return None

# ─── MAIN APP ────────────────────────────────────────────────────────────────

st.title("🧬 Biological Profiling Dashboard")
st.markdown("*Neural Engine: **DNABERT-2** | Analysis: **Zero-shot Similarity***")

# Load model
try:
    embedder, tokenizer, config, device, knn_model, species_list = get_model_and_database()
except Exception as e:
    st.error(f"Engine Core Failure: {e}")
    st.stop()

# Dashboard Grid
col1, col2 = st.columns([1, 2], gap="large")

with col1:
    st.markdown("### 📥 Primary Input")
    uploaded_file = st.file_uploader("Upload eDNA Sequence Data", type=["fasta", "csv", "txt"])
    
    if st.button("🔄 Reset Global State"):
        st.rerun()

    st.markdown("---")
    st.markdown("### 🐾 Species Library")
    st.caption(f"Active Reference Library: {len(species_list)} species loaded.")
    st.write(", ".join(species_list[:15]) + "...")

with col2:
    if uploaded_file:
        file_bytes = uploaded_file.read()
        records = parse_sequences(file_bytes, uploaded_file.name)
        
        if not records:
            st.warning("Empty or invalid file detected.")
        else:
            results = []
            progress = st.progress(0)
            
            with st.status("Analyzing Genomic Samples...", expanded=True) as status:
                for i, (hdr, seq) in enumerate(records):
                    clean = "".join(b for b in seq.upper() if b in "ATCG")
                    if len(clean) < 10:
                        results.append({"ID": hdr, "Species": "Invalid", "Similarity": 0.0, "Status": "Short Seq"})
                        continue
                    
                    try:
                        emb = get_embedding(clean, embedder, tokenizer, device)
                        dist, idx = knn_model.kneighbors(emb.reshape(1, -1), n_neighbors=1)
                        species = knn_model.classes_[knn_model._y[idx[0][0]]]
                        sim = 1.0 - dist[0][0]
                        det = "✅ Detected" if sim >= 0.6 else "⚠️ Weak"
                        results.append({"ID": hdr, "Species": species, "Similarity": float(sim), "Status": det})
                    except:
                        results.append({"ID": hdr, "Species": "Error", "Similarity": 0.0, "Status": "AI Fail"})
                    progress.progress((i + 1) / len(records))
                status.update(label="Analysis Done", state="complete", expanded=False)

            # Analysis Summary
            df = pd.DataFrame(results)
            detected = df[df["Status"] == "✅ Detected"]
            
            m1, m2, m3 = st.columns(3)
            m1.metric("Total Analysis", len(records))
            m2.metric("Positive IDs", len(detected))
            top = detected["Species"].mode()[0] if not detected.empty else None
            m3.metric("Dominant Match", top if top else "None")

            # Wikipedia Intelligence Highlight
            if top:
                wiki = get_wikipedia_info(top)
                if wiki:
                    st.markdown(f"## 📖 Profile: {wiki['title']}")
                    w1, w2 = st.columns([1, 2])
                    with w1:
                        if wiki['image_url']:
                            st.image(wiki['image_url'], use_container_width=True)
                    with w2:
                        st.write(wiki['extract'])
                        st.markdown(f'<a href="{wiki["wiki_url"]}" target="_blank" class="wiki-btn">🚀 Full Research Profile</a>', unsafe_allow_html=True)
                    st.markdown("---")

            st.markdown("### 📊 Dataset Findings")
            st.dataframe(df.drop(columns=["Similarity"]), width='stretch', hide_index=True)
    else:
        st.info("🧬 **Biological Profiling Ready**: Please upload a DNA dataset to begin analysis.")
        st.markdown("""
        1. **Genomic Alignment**: We use DNABERT-2 for state-of-the-art embedding.
        2. **Similarity Matching**: Your sample is compared against the global database.
        3. **Real-time Research**: Automated Wikipedia profiling for identified species.
        """)
