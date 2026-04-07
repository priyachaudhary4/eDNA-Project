import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'server')))
from server.db.base import SessionLocal
from server.models.database_models import Sample

def update_countries():
    db = SessionLocal()
    samples = db.query(Sample).all()
    for s in samples:
        if "Brahmaputra" in s.region or "Ganga" in s.region or "Western Ghats" in s.region:
            s.country = "India"
        elif "Yellowstone" in s.region or "Everglades" in s.region or "National Park" in s.region:
            s.country = "USA"
        elif "Mekong" in s.region:
            s.country = "Vietnam"
        else:
            s.country = "India" # Default for this demo
    db.commit()
    print(f"Updated {len(samples)} samples with country data.")
    db.close()

if __name__ == "__main__":
    update_countries()
