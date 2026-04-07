
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'server'))

from server.models.database_models import Sample, SpeciesResult
from server.db.base import engine, SessionLocal

db = SessionLocal()

print("--- Samples Analysis ---")
samples = db.query(Sample).all()
for s in samples:
    species_count = db.query(SpeciesResult).filter(SpeciesResult.sample_id == s.id).count()
    print(f"ID: {s.id} | File: {s.filename} | Active: {s.is_active} | Status: {s.status} | Count: {species_count} | Batch: {s.batch_id}")

print("\n--- Species Richness Calculation (Active == 1) ---")
from sqlalchemy import func
results = db.query(
    SpeciesResult.species_name
).join(Sample).filter(Sample.is_active == 1).group_by(SpeciesResult.species_name).all()

print(f"Total Unique Species (Richness): {len(results)}")

db.close()
