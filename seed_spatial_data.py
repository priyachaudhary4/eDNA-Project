import sys
import os
from sqlalchemy.orm import Session
import datetime
import random

# Add parent directory to sys.path to import from server
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'server')))

from server.db.base import SessionLocal, engine, Base
from server.models.database_models import Sample, SpeciesResult, Alert

def seed_data():
    db = SessionLocal()
    
    # Clear existing data if any (optional, but good for consistent demo)
    # db.query(SpeciesResult).delete()
    # db.query(Sample).delete()
    # db.query(Alert).delete()
    
    locations = [
        {
            "filename": "Brahmaputra_Sample_01.fasta",
            "region": "Brahmaputra Basin",
            "lat": 26.11,
            "lng": 91.70,
            "habitat": "Riverine Ecosystem",
            "status": "Completed"
        },
        {
            "filename": "Ganga_Delta_Sunderbans.fastq",
            "region": "Ganga Delta",
            "lat": 22.15,
            "lng": 88.65,
            "habitat": "Mangrove Forest",
            "status": "Completed"
        },
        {
            "filename": "Western_Ghats_SilentValley.csv",
            "region": "Western Ghats Reserve",
            "lat": 11.13,
            "lng": 76.43,
            "habitat": "Tropical Rainforest",
            "status": "Processing"
        },
        {
            "filename": "Yellowstone_Monitoring.fasta",
            "region": "National Park System",
            "lat": 44.42,
            "lng": -110.58,
            "habitat": "Alpine Forest",
            "status": "Completed"
        },
        {
            "filename": "Mekong_Delta_Zone.fastq",
            "region": "Mekong Delta Zone",
            "lat": 10.03,
            "lng": 105.78,
            "habitat": "Wetlands",
            "status": "Completed"
        },
        {
            "filename": "Everglades_Detection.csv",
            "region": "National Park System",
            "lat": 25.28,
            "lng": -80.89,
            "habitat": "Subtropical Marshes",
            "status": "Failed"
        }
    ]
    
    for loc in locations:
        sample = Sample(
            filename=loc["filename"],
            region=loc["region"],
            latitude=loc["lat"],
            longitude=loc["lng"],
            habitat_type=loc["habitat"],
            sample_type="eDNA Sequence",
            status=loc["status"]
        )
        db.add(sample)
        db.flush()
        
        # Add some mock species for completed ones
        if loc["status"] == "Completed":
            species_data = [
                {"name": "Panthera tigris", "common": "Tiger", "status": "Endangered"},
                {"name": "Platanista gangetica", "common": "Ganges River Dolphin", "status": "Endangered"},
                {"name": "Hypophthalmichthys molitrix", "common": "Silver Carp", "status": "Invasive"}
            ]
            for s in species_data:
                res = SpeciesResult(
                    sample_id=sample.id,
                    species_name=s["name"],
                    common_name=s["common"],
                    status=s["status"],
                    count=random.randint(1, 100),
                    confidence=0.95,
                    geographic_region=loc["region"]
                )
                db.add(res)
                
                # Add alert for significant ones
                if s["status"] in ["Endangered", "Invasive"]:
                    alert = Alert(
                        type="Critical Alert" if s["status"] == "Invasive" else "Conservation Priority",
                        message=f"BioScope Warning: {s['status']} {s['name']} detected in {loc['region']}.",
                        species_involved=s["name"],
                        location=loc["region"]
                    )
                    db.add(alert)
    
    db.commit()
    print("Spatial intelligence seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
