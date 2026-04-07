import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'server')))
from server.db.base import SessionLocal
from server.models.database_models import Sample, SpeciesResult, Alert

def clear_db():
    db = SessionLocal()
    try:
        db.query(SpeciesResult).delete()
        db.query(Alert).delete()
        db.query(Sample).delete()
        db.commit()
        print("Database cleared successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_db()
