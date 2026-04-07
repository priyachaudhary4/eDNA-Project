from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), 'server'))

from db.base import SessionLocal
from models.database_models import Sample, SpeciesResult

db = SessionLocal()
samples = db.query(Sample).all()
print(f"Total Samples: {len(samples)}")
for s in samples:
    print(f"Sample ID: {s.id}, Filename: {s.filename}, Active: {s.is_active}, Status: {s.status}")
    results = db.query(SpeciesResult).filter_by(sample_id=s.id).all()
    print(f"  Results count: {len(results)}")
    for r in results[:3]:
        print(f"    Species: {r.species_name}, Status: {r.status}")
db.close()
