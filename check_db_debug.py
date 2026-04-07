import sys
import os
from sqlalchemy import inspect
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'server')))
from server.db.base import engine, SessionLocal
from server.models.database_models import Sample

def check_db():
    inspector = inspect(engine)
    columns = inspector.get_columns('samples')
    print("Columns in 'samples':")
    for col in columns:
        print(f" - {col['name']} ({col['type']})")
    
    db = SessionLocal()
    sample = db.query(Sample).first()
    if sample:
        print("\nFirst sample data:")
        for attr in ['id', 'filename', 'region', 'latitude', 'longitude', 'sampling_date', 'status', 'created_at']:
            print(f" - {attr}: {getattr(sample, attr)}")
    else:
        print("\nNo samples found.")
    db.close()

if __name__ == "__main__":
    check_db()
