from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Absolute path to the database
db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
engine = create_engine(f"sqlite:///{db_path}")
SessionLocal = sessionmaker(bind=engine)

from sqlalchemy import Table, MetaData
metadata = MetaData()
metadata.reflect(bind=engine)

try:
    samples_table = metadata.tables['samples']
    species_results_table = metadata.tables['species_results']
    
    with engine.connect() as conn:
        from sqlalchemy import select
        samples = conn.execute(select(samples_table)).fetchall()
        print(f"Total Samples: {len(samples)}")
        for s in samples:
            print(f"Sample ID: {s.id}, Filename: {s.filename}, Active: {s.is_active}, Status: {s.status}")
            results = conn.execute(select(species_results_table).where(species_results_table.c.sample_id == s.id)).fetchall()
            print(f"  Results count: {len(results)}")
            for r in results[:3]:
                print(f"    Species: {r.species_name}, Status: {r.status}")
except Exception as e:
    print(f"Error: {e}")
