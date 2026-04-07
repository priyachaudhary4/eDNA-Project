#!/usr/bin/env python3
"""
train_classifier.py
===================
Loads DNA sequences from reference_db.json, generates DNABERT-2 embeddings,
and trains a KNN classifier, saving it to models/knn_species_classifier.pkl.
"""

import json
import os
import sys
import logging
import joblib
import torch
import numpy as np
from tqdm import tqdm
from sklearn.neighbors import KNeighborsClassifier

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dna_embedder import load_embedder_and_tokenizer, get_embedding, _resolve_path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Constants
MODEL_NAME = "DNABERT-2-117M"
DB_PATH = "reference_db.json"
OUTPUT_DIR = "models"
MODEL_FILENAME = "knn_species_classifier.pkl"


def main():
    logger.info("Starting KNN classifier training pipeline...")

    # Ensure output directory exists
    os.makedirs(_resolve_path(OUTPUT_DIR), exist_ok=True)
    out_path = os.path.join(_resolve_path(OUTPUT_DIR), MODEL_FILENAME)

    # 1. Load Reference Data
    db_file = _resolve_path(DB_PATH)
    if not os.path.exists(db_file):
        logger.error(f"Reference database not found at {db_file}")
        sys.exit(1)

    logger.info(f"Loading reference sequences from {db_file}...")
    with open(db_file, "r") as f:
        records = json.load(f)

    # Parse JSON to extract species and their cleaned sequences
    all_species = []
    all_sequences = []

    for record in records:
        species_name = record.get("species", "Unknown")
        fasta_content = record.get("fasta_content", "")
        
        # Parse the fasta string
        seq_parts = []
        for line in fasta_content.splitlines():
            line = line.strip()
            if line.startswith(">"):
                if seq_parts:
                    seq = "".join(seq_parts)
                    clean = "".join(b for b in seq.upper() if b in "ATCG")
                    if len(clean) >= 10:
                        all_species.append(species_name)
                        all_sequences.append(clean)
                seq_parts = []
            elif line:
                seq_parts.append(line)
        if seq_parts:
            seq = "".join(seq_parts)
            clean = "".join(b for b in seq.upper() if b in "ATCG")
            if len(clean) >= 10:
                all_species.append(species_name)
                all_sequences.append(clean)

    logger.info(f"Found {len(all_sequences)} sequences across {len(set(all_species))} species.")

    # 2. Load DNABERT-2 Embedder
    logger.info("Loading DNABERT-2 model for embedding generation...")
    embedder, tokenizer, device = load_embedder_and_tokenizer(MODEL_NAME)

    # 3. Generate Embeddings
    logger.info("Generating embeddings for all sequences...")
    embeddings = []
    
    # Process sequentially with tqdm to show progress and preserve memory
    for seq in tqdm(all_sequences, desc="Embedding sequences"):
        # get_embedding returns a 1D proper tensor
        emb = get_embedding(seq, embedder, tokenizer, device)
        embeddings.append(emb.numpy())

    X = np.vstack(embeddings)
    y = np.array(all_species)

    logger.info(f"Generated feature matrix X with shape: {X.shape}")

    # 4. Train KNN Classifier
    # Note: Because the dataset sizes for species range down to 1 or 2 sequences,
    # we enforce n_neighbors=1 to avoid errors from asking for 5 neighbors from 1 sample
    logger.info("Training KNN Classifier...")
    knn = KNeighborsClassifier(n_neighbors=1, metric="cosine")
    knn.fit(X, y)
    
    # 5. Save the trained model
    logger.info(f"Saving trained model to {out_path}...")
    joblib.dump(knn, out_path)
    
    logger.info(f"✅ Success! Trained KNN classifer saved to {out_path}.")


if __name__ == "__main__":
    main()
