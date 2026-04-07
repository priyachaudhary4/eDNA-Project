import os
import csv
import torch
import pandas as pd
import streamlit as st
import time
import requests
import streamlit.components.v1 as components

# Ensure we can import local modules
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import joblib
try:
    from dna_embedder import load_embedder_and_tokenizer, get_embedding, _resolve_path
except ImportError:
    # Handle case where user might have moved things
    def _resolve_path(p): return p

# Load the project root config path (if still needed)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_CONFIG_PATH = os.path.join(_SCRIPT_DIR, "config.json")

# ─── UI & PAGE CONFIG ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="🧬 eDNA Biodiversity AI",
    page_icon="🌿",
    layout="wide",
)

# Global Style Injection
st.markdown("""
<style>
/* Modern, clean Glassmorphism UI */
body, .stApp {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
    color: #f8fafc !important;
    font-family: 'Inter', sans-serif !important;
}
.main .block-container {
    padding-top: 2rem !important;
    max-width: 1200px !important;
}
.stMetric {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 12px !important;
    padding: 1.5rem !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}
h1, h2, h3 {
    background: -webkit-linear-gradient(45deg, #10b981, #06b6d4) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    font-weight: 800 !important;
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
    
    with st.spinner(f"Initializing DNABERT-2 ({model_name})..."):
        # Correctly passing model_name to the loader
        embedder, tokenizer, device = load_embedder_and_tokenizer(model_name)
        
        # Load KNN model and species list
        _current_dir = os.path.dirname(os.path.abspath(__file__))
        knn_path = os.path.join(_current_dir, "models", "knn_species_classifier.pkl")
        if not os.path.exists(knn_path):
             knn_path = _resolve_path("models/knn_species_classifier.pkl")
        
        if not os.path.exists(knn_path):
            raise FileNotFoundError(f"KNN model not found at {knn_path}. Please run train_classifier.py first.")
            
        knn_model = joblib.load(knn_path)
        species_list = list(knn_model.classes_)
        
        return embedder, tokenizer, config, device, knn_model, species_list

def parse_sequences(file_content, filename):
    """Parse FASTA, CSV, or TXT file into (header, sequence) tuples."""
    records = []
    lines = file_content.decode("utf-8").splitlines()
    ext = filename.split(".")[-1].lower()

    if ext == "fasta":
        header = None
        seq_parts = []
        for line in lines:
            if line.startswith(">"):
                if header: records.append((header, "".join(seq_parts)))
                header = line[1:].strip()
                seq_parts = []
            else:
                seq_parts.append(line.strip())
        if header: records.append((header, "".join(seq_parts)))

    elif ext == "csv":
        reader = csv.DictReader(lines)
        for i, row in enumerate(reader, 1):
            if "sequence" in row:
                seq = row["sequence"].strip() if row["sequence"] else ""
                records.append((f"Row_{i}", seq))
            else:
                val = list(row.values())[0] if row else ""
                records.append((f"Row_{i}", val.strip() if val else ""))

    elif ext == "txt":
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped:
                records.append((f"Line_{i}", stripped))

    return records


@st.cache_data(show_spinner=False, ttl=3600)
def get_wikipedia_info(species_name: str):
    """Fetch species summary and image from Wikipedia REST API with fallback search."""
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
                "image_url": data.get("thumbnail", {}).get("source", None)
            }
        
        # Fallback Search
        search_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={species_name}&format=json&origin=*"
        sr = requests.get(search_url, headers=headers, timeout=5)
        if sr.status_code == 200:
            search_results = sr.json().get("query", {}).get("search", [])
            if search_results:
                top_match = search_results[0]["title"]
                retry_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{top_match.replace(' ', '_')}"
                rr = requests.get(retry_url, headers=headers, timeout=5)
                if rr.status_code == 200:
                    data = rr.json()
                    return {
                        "title": data.get("title", top_match),
                        "extract": data.get("extract", "No summary available."),
                        "image_url": data.get("thumbnail", {}).get("source", None)
                    }
    except Exception:
        pass
    return None

def render_wiki_card(wiki_info):
    """Render a premium Wikipedia card using HTML component to prevent style stripping."""
    wiki_url = f"https://en.wikipedia.org/wiki/{wiki_info['title'].replace(' ', '_')}"
    img_tag = f'<img src="{wiki_info["image_url"]}" alt="{wiki_info["title"]}">' if wiki_info["image_url"] else ''
    
    html_content = f"""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
        .card {{
            font-family: 'Inter', sans-serif;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 20px;
            padding: 24px;
            color: #f8fafc;
            display: flex;
            gap: 24px;
            animation: slideUp 0.6s ease-out;
            margin-bottom: 20px;
        }}
        .img-container {{
            flex: 0 0 200px;
            height: 150px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(16, 185, 129, 0.3);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
        }}
        .img-container:hover {{
            transform: scale(1.1) rotate(2deg);
            border-color: #10b981;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        }}
        .img-container img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }}
        .content {{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        h3 {{
            margin: 0 0 10px 0;
            background: linear-gradient(45deg, #10b981, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 1.5rem;
            font-weight: 800;
        }}
        p {{
            margin: 0;
            font-size: 1rem;
            line-height: 1.6;
            color: #cbd5e1;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }}
        .btn {{
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.9rem;
            margin-top: 15px;
            transition: all 0.3s ease;
            text-align: center;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }}
        .btn:hover {{
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.4);
        }}
        @keyframes slideUp {{
            from {{ opacity: 0; transform: translateY(30px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
    </style>
    <div class="card">
        <div class="img-container">
            {img_tag}
        </div>
        <div class="content">
            <div>
                <h3>📖 About {wiki_info["title"]}</h3>
                <p>{wiki_info["extract"]}</p>
            </div>
            <a href="{wiki_url}" target="_blank" class="btn">🚀 Research on Wikipedia</a>
        </div>
    </div>
    """
    components.html(html_content, height=250)


# ─── MAIN APP ────────────────────────────────────────────────────────────────

st.title("🧬 eDNA Biodiversity AI Explorer")
st.markdown("*Zero-shot Species Detection via **DNABERT-2** Embedding Similarity*")

# Load model
try:
    embedder, tokenizer, config, device, knn_model, species_list = get_model_and_database()
except Exception as e:
    st.error(f"Error loading model: {e}")
    st.stop()

# Layout
col1, col2 = st.columns([1, 2], gap="large")

with col1:
    st.markdown("### 📥 Upload Sample")
    st.markdown("Provide eDNA sequencing data from hair, blood, soil, or water samples.")
    uploaded_file = st.file_uploader(
        "Supported formats: .fasta, .csv, .txt",
        type=["fasta", "csv", "txt"]
    )

    if st.button("🔄 Reset / Clear", width='stretch'):
        st.rerun()

    st.markdown("---")
    # Wikipedia Research Tool
    st.markdown("### 📚 Species Research")
    wiki_query = st.text_input("Quick Lookup:", placeholder="e.g. Panthera leo", key="wiki_search")
    if wiki_query:
        with st.spinner("Fetching bio-data..."):
            wiki_data = get_wikipedia_info(wiki_query)
            if wiki_data:
                render_wiki_card(wiki_data)
            else:
                st.error("No biological record found.")

    st.markdown("---")
    # Show supported species
    st.markdown("### 🐾 Species Database")
    st.markdown(f"**{len(species_list)} species** loaded from reference library:")
    st.write(", ".join(species_list[:20]) + "...")


with col2:
    if uploaded_file is not None:
        file_bytes = uploaded_file.read()
        records = parse_sequences(file_bytes, uploaded_file.name)
        
        if not records:
            st.warning("No sequences found in file.")
        else:
            st.info(f"Loaded {len(records)} sequences. Starting AI analysis...")
            
            results = []
            progress_bar = st.progress(0)
            
            with st.status("Analyzing DNA Sequences...", expanded=True) as status_box:
                for i, (hdr, seq) in enumerate(records):
                    clean_seq = "".join(b for b in seq.upper() if b in "ATCG")
                    if len(clean_seq) < 10:
                        results.append({"ID": hdr, "Species": "Invalid", "Status": "Too Short", "Similarity": 0.0})
                        continue

                    try:
                        emb = get_embedding(clean_seq, embedder, tokenizer, device)
                        emb_np = emb.numpy().reshape(1, -1)
                        distances, indices = knn_model.kneighbors(emb_np, n_neighbors=1)
                        species = knn_model.classes_[knn_model._y[indices[0][0]]]
                        conf = 1.0 - distances[0][0]
                        verdict = "✅ Detected" if conf >= 0.6 else "⚠️ Inconclusive"
                        results.append({"ID": hdr, "Species": species, "Similarity": float(conf), "Status": verdict})
                    except Exception as e:
                        results.append({"ID": hdr, "Species": "Error", "Status": f"❌ {str(e)[:20]}", "Similarity": 0.0})

                    progress_bar.progress((i + 1) / len(records))

                status_box.update(label="Analysis Complete", state="complete", expanded=False)
                
                # Render Metrics
                df = pd.DataFrame(results)
                valid_df = df[df["Status"] == "✅ Detected"]
                
                met1, met2, met3 = st.columns(3)
                met1.metric("Total Processed", len(records))
                met2.metric("High Similarity Finds", len(valid_df))
                
                top_find = valid_df["Species"].mode()[0] if not valid_df.empty else None
                met3.metric("Most Common", top_find if top_find else "None")

                # Wikipedia Highlight
                if top_find:
                    wiki_info = get_wikipedia_info(top_find)
                    if wiki_info:
                        render_wiki_card(wiki_info)

                st.markdown("#### Detailed Findings")
                st.dataframe(df.style.set_properties(**{'background-color': '#111827', 'color': '#f8fafc', 'border-color': '#374151'}), width='stretch', hide_index=True)
                
                csv_data = df.to_csv(index=False).encode('utf-8')
                st.download_button("⬇️ Download Full Results Report", csv_data, "dna_results.csv", "text/csv")
    else:
        st.write("---")
        st.info("💡 **Ready for Input**: Upload a FASTA, CSV, or TXT file to begin eDNA profiling.")
        st.markdown("""
        ### How it works:
        1. **DNA Embedding**: We convert raw nucleotides into high-dimensional vectors.
        2. **Similarity Engine**: Our AI compares your sample against our global reference library.
        3. **Wikipedia Integration**: Once identified, we pull real-time biological data for your research.
        """)
