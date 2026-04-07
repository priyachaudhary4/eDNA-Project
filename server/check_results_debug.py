import sys
import os
from sqlalchemy import inspect
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from db.base import engine, SessionLocal
from models.database_models import SpeciesResult

def check_results():
    db = SessionLocal()
    result = db.query(SpeciesResult).first()
    if result:
        print("\nFirst species result:")
        for attr in ['id', 'sample_id', 'species_name', 'common_name', 'status', 'count', 'confidence', 'taxonomic_id']:
            print(f" - {attr}: {getattr(result, attr)}")
    else:
        print("\nNo species results found.")
    db.close()

if __name__ == "__main__":
    check_results()
