
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add the current directory to sys.path so we can import local modules
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'server'))

from server.models.database_models import Sample, SpeciesResult
from server.db.base import engine, SessionLocal

db = SessionLocal()

print("--- Samples ---")
samples = db.query(Sample).all()
for s in samples:
    species_count = db.query(SpeciesResult).filter(SpeciesResult.sample_id == s.id).count()
    print(f"ID: {s.id}, Filename: {s.filename}, Status: {s.status}, IsActive: {s.is_active}, Species Count: {species_count}, Created: {s.created_at}")

print("\n--- Global Metrics (Active) ---")
from server.main import get_dashboard_metrics
import asyncio

async def show_metrics():
    metrics = await get_dashboard_metrics(db)
    print(metrics)

# Run metrics if possible, or just simulate the query
from sqlalchemy import func
results = db.query(
    SpeciesResult.species_name,
    func.sum(SpeciesResult.count).label("total_count")
).join(Sample).filter(Sample.is_active == 1).group_by(SpeciesResult.species_name).all()

print(f"Species Richness (Unique Names): {len(results)}")
print(f"Total Detections Sum: {sum(r.total_count for r in results)}")

db.close()
