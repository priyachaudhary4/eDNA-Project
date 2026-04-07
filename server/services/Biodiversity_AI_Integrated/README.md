# 🧬 eDNA Biodiversity AI Explorer
### Universal Species Detection | DNABERT-2-117M + KNN | Streamlit & CLI

Upload eDNA sequences from hair, blood, soil, or water and detect species using **DNABERT-2-117M** embeddings combined with a dynamic **K-Nearest Neighbors (KNN)** classifier.

---

## Architecture

This project uses DNABERT-2 purely as a foundational embedding model to extract rich features from DNA sequences, and then a lightweight KNN classifier (using Cosine Similarity) to classify against a dynamic reference database.

```text
Raw DNA String
      │
      ▼
DNABERT-2 Tokenizer  (BPE tokenization, internal to model)
      │
      ▼
DNABERT-2 Encoder  (117M params — MosaicBERT, 12 layers, 768-dim)
      │   pre-trained on 135 species genomes from NCBI
      ▼
[CLS] Token Embedding  (768-dim contextual sequence representation)
      │
      ▼
KNN Classifier (n_neighbors=1, metric="cosine")
      │   fitted on reference_db.json
      ▼
Predicted Species + Confidence Score
      │   < Threshold (e.g., 60%)
      ▼
"✅ Detected" OR "⚠️ Inconclusive"
```

---

## File Structure

```text
Biodiversity_AI/
├── config.json               ← configurations (threshold, max_len)
├── dna_embedder.py           ← DNABERT-2 loading & embedding extraction
├── train_classifier.py       ← trains the KNN classifier from reference_db.json
├── predict.py                ← CLI inference tool (interactive/FASTA/CSV)
├── app.py                    ← Streamlit web UI
├── reference_db.json         ← Dynamic, labeled DNA sequence database
├── models/
│   └── knn_species_classifier.pkl  ← Trained scikit-learn KNN artifact
├── requirements.txt          ← pip dependencies
├── biodiversity_demo_dataset/← sample FASTA files
└── DNABERT-2-117M/           ← local model weights (from HuggingFace)
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Classifier
Before running inference, you must train the KNN model using the sequences in the reference database:
```bash
python train_classifier.py
```
*This generates the `models/knn_species_classifier.pkl` file used by the application.*

### 3. Run the Streamlit app

```bash
streamlit run app.py
```

Upload a `.fasta`, `.csv`, or `.txt` file to detect species.

### 4. CLI inference (alternative)

```bash
# Single sequence
python predict.py --seq "ATCGATCGATCGATCGATCGATCGATCG..."

# FASTA file
python predict.py --fasta biodiversity_demo_dataset/Bos_taurus/Bos_taurus_combined.fasta

# CSV batch
python predict.py --csv data.csv --output results.csv

# Interactive mode
python predict.py
```

---

## Supported Species

Unlike fixed-head architectures, this system supports **unlimited species**. 

To add new species:
1. Open `reference_db.json` and add a new entry referencing the species name and a fasta string.
2. Re-run `python train_classifier.py` to update the KNN model.
3. The species will instantly be available for detection in the Streamlit app and CLI.

---

## Key Design Decisions

- **Embedding & Similarity Inference** — uses DNABERT-2 for 768-dimensional sequence representation and KNN (Cosine Metric) for similarity matching.
- **Dynamic Database** — entirely decoupled classifier. Adding a species no longer requires fine-tuning or modifying layers; simply update the `reference_db.json` and re-train the KNN.
- **Confidence threshold gate** — similarity scores below the threshold (configured in `config.json`) are flagged as "⚠️ Inconclusive".
- **Local offline model** — primary weights sit in `DNABERT-2-117M/` directory for offline usage.
- **Mac M1 compatible** — automatically uses MPS acceleration when available.

---

## Requirements

- Python 3.10+
- PyTorch ≥ 2.0.0
- scikit-learn
- transformers ≥ 4.40.0
- streamlit ≥ 1.28.0
- einops (required by DNABERT-2 MosaicBERT architecture)
