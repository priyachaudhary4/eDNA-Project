#!/usr/bin/env python3
"""
predict.py — CLI Inference Tool for DNABERT-2 Species Detection
================================================================
Uses a trained KNN classifier on DNABERT-2 embeddings.

Usage:
    python predict.py --seq "ATCGATCGATCGATCGATCG..."
    python predict.py --fasta sample.fasta
    python predict.py --csv test.csv --output results.csv
    python predict.py   # interactive mode
"""

import argparse
import csv
import os
import sys
import joblib

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dna_embedder import load_embedder_and_tokenizer, get_embedding, _resolve_path


def parse_fasta(filepath: str) -> list[tuple[str, str]]:
    """Parse a FASTA file → list of (header, sequence)."""
    records = []
    header, seq_parts = "Seq_1", []
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                if seq_parts:
                    records.append((header, "".join(seq_parts)))
                header = line[1:].strip()
                seq_parts = []
            elif line:
                seq_parts.append(line)
    if seq_parts:
        records.append((header, "".join(seq_parts)))
    return records


def clean_sequence(seq: str) -> str:
    return "".join(b for b in seq.upper() if b in "ATCG")


def run_prediction(embedder, tokenizer, device, knn_model, header: str, seq: str) -> dict:
    clean = clean_sequence(seq)
    if len(clean) < 10:
        return {"ID": header, "Species": "N/A", "Embedding Similarity": "N/A"}

    # 1. Generate embedding
    emb = get_embedding(clean, embedder, tokenizer, device)
    emb_np = emb.numpy().reshape(1, -1)

    # 2. Predict with KNN (using kneighbors for accurate cosine similarity confidence)
    n_neighbors_to_fetch = min(15, len(knn_model._fit_X))
    distances, indices = knn_model.kneighbors(emb_np, n_neighbors=n_neighbors_to_fetch)
    
    Species = knn_model.classes_[knn_model._y[indices[0][0]]]
    Confidence = 1.0 - distances[0][0]

    # Get top matches
    top_matches = []
    for idx in indices[0]:
        species = knn_model.classes_[knn_model._y[idx]]
        if species not in top_matches:
            top_matches.append(species)
        if len(top_matches) >= 3:
            break

    return {
        "ID": header,
        "Species": Species,
        "Embedding Similarity": Confidence,
        "Top_Matches": top_matches,
    }


def print_result(res: dict):
    print(f"\nRecord : {res['ID']}")
    if res['Species'] == "N/A":
        print("Status: Too short (<10 bp)")
        return
        
    print(f"Predicted Species: {res['Species']}")
    print(f"Embedding Similarity: {float(res['Embedding Similarity']):.2f}")
    
    if "Top_Matches" in res and res["Top_Matches"]:
        print("\nTop matches:")
        for i, match in enumerate(res["Top_Matches"]):
            print(f"{i+1}. {match}")


def main():
    parser = argparse.ArgumentParser(
        description="DNABERT-2 Species Detection — KNN Inference CLI",
    )
    parser.add_argument("--seq", type=str, help="Single DNA sequence string")
    parser.add_argument("--fasta", type=str, help="Path to a FASTA file")
    parser.add_argument("--csv", type=str, help="Path to a CSV file (needs 'sequence' column)")
    parser.add_argument("--output", type=str, help="Output CSV path for batch results")
    args = parser.parse_args()

    print("🧬 Loading DNABERT-2 model...")
    embedder, tokenizer, device = load_embedder_and_tokenizer("DNABERT-2-117M")
    
    model_path = _resolve_path("models/knn_species_classifier.pkl")
    print("📦 Loading trained KNN classifier...")
    if not os.path.exists(model_path):
        print(f"❌ Error: KNN model not found at {model_path}")
        print("Please run train_classifier.py first.")
        sys.exit(1)
        
    knn_model = joblib.load(model_path)

    if args.seq:
        res = run_prediction(embedder, tokenizer, device, knn_model, "CLI_Input", args.seq)
        print_result(res)
        return

    if args.fasta:
        records = parse_fasta(args.fasta)
        print(f"📂 Parsed {len(records)} sequences from {args.fasta}")
        results = []
        for hdr, seq in records:
            res = run_prediction(embedder, tokenizer, device, knn_model, hdr, seq)
            print_result(res)
            results.append(res)
        if args.output:
            _write_csv(results, args.output)
        return

    if args.csv:
        results = []
        with open(args.csv) as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        print(f"📂 Parsed {len(rows)} rows from {args.csv}")
        for i, row in enumerate(rows, 1):
            seq = row.get("sequence", "").strip()
            res = run_prediction(embedder, tokenizer, device, knn_model, f"Row_{i}", seq)
            print_result(res)
            results.append(res)
        if args.output:
            _write_csv(results, args.output)
        return

    # Interactive mode
    print("🔬 Interactive mode — paste a DNA sequence and press Enter.")
    print("   Type 'quit' or 'exit' to stop.\n")
    while True:
        try:
            seq = input("DNA> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break
        if seq.lower() in ("quit", "exit", "q"):
            break
        if not seq:
            continue
        res = run_prediction(embedder, tokenizer, device, knn_model, "Interactive", seq)
        print_result(res)


def _write_csv(results: list[dict], path: str):
    keys = ["ID", "Species", "Embedding Similarity"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)
    print(f"\n💾 Results saved to {path}")


if __name__ == "__main__":
    main()
