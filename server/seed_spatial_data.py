import sys
import os
import datetime
import random

# Add current directory to sys.path to import from sibling modules if needed
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from db.base import SessionLocal, engine, Base
from models.database_models import Sample, SpeciesResult, Alert

def seed_data():
    db = SessionLocal()
    
    # Check if we already have data to avoid duplicates
    # If you want to force re-seed, comment this out
    # if db.query(Sample).count() > 5:
    #     print("Database already has enough sample data. Skipping seed.")
    #     db.close()
    #     return

    locations = [
        {"filename": "Brahmaputra_Sample_01.fasta", "region": "Brahmaputra Basin", "country": "India", "lat": 26.11, "lng": 91.70, "habitat": "Riverine Ecosystem", "status": "Completed"},
        {"filename": "Ganga_Delta_Sunderbans.fastq", "region": "Ganga Delta", "country": "India", "lat": 22.15, "lng": 88.65, "habitat": "Mangrove Forest", "status": "Completed"},
        {"filename": "Western_Ghats_SilentValley.csv", "region": "Western Ghats Reserve", "country": "India", "lat": 11.13, "lng": 76.43, "habitat": "Tropical Rainforest", "status": "Processing"},
        {"filename": "Kaziranga_Monitoring.fasta", "region": "Kaziranga Wetlands", "country": "India", "lat": 26.58, "lng": 93.17, "habitat": "Marshland", "status": "Completed"},
        {"filename": "Ranthambore_Hotspot.csv", "region": "Ranthambore Reserve", "country": "India", "lat": 26.01, "lng": 76.50, "habitat": "Dry Deciduous Forest", "status": "Completed"},
        {"filename": "Yellowstone_Monitoring.fasta", "region": "Yellowstone National Park", "country": "USA", "lat": 44.42, "lng": -110.58, "habitat": "Alpine Forest", "status": "Completed"},
        {"filename": "Everglades_Detection.csv", "region": "Everglades Wetlands", "country": "USA", "lat": 25.28, "lng": -80.89, "habitat": "Subtropical Marshes", "status": "Completed"},
        {"filename": "Yosemite_Analysis.fastq", "region": "Yosemite Valley", "country": "USA", "lat": 37.74, "lng": -119.59, "habitat": "Sierra Nevada Forest", "status": "Processing"},
        {"filename": "Mekong_Delta_Zone.fastq", "region": "Mekong Delta", "country": "Vietnam", "lat": 10.03, "lng": 105.78, "habitat": "Wetlands", "status": "Completed"},
        {"filename": "HaLongBay_Marine.csv", "region": "Ha Long Bay", "country": "Vietnam", "lat": 20.91, "lng": 107.18, "habitat": "Marine Karst", "status": "Completed"}
    ]
    
    # Define regional species profiles to make filtering distinct
    regional_profiles = {
        "Brahmaputra Basin": [
            {"name": "Gavialis gangeticus", "common": "Gharial", "status": "Endangered"},
            {"name": "Nelumbo nucifera", "common": "Lotus", "status": "Native"}
        ],
        "Ganga Delta": [
            {"name": "Platanista gangetica", "common": "Ganges River Dolphin", "status": "Endangered"},
            {"name": "Phoenix paludosa", "common": "Mangrove Date Palm", "status": "Native"}
        ],
        "Western Ghats Reserve": [
            {"name": "Hemitragus hylocrius", "common": "Nilgiri Tahr", "status": "Rare"},
            {"name": "Strobilanthes kunthiana", "common": "Neelakurinji", "status": "Native"}
        ],
        "Kaziranga Wetlands": [
            {"name": "Rhinoceros unicornis", "common": "Indian Rhino", "status": "Endangered"},
            {"name": "Saccharum ravennae", "common": "Elephant Grass", "status": "Native"}
        ],
        "Ranthambore Reserve": [
            {"name": "Panthera tigris tigris", "common": "Bengal Tiger", "status": "Endangered"},
            {"name": "Butea monosperma", "common": "Flame of the Forest", "status": "Native"}
        ],
        "Yellowstone National Park": [{"name": "Canis lupus", "common": "Gray Wolf", "status": "Native"}],
        "Everglades Wetlands": [{"name": "Python bivittatus", "common": "Burmese Python", "status": "Invasive"}],
        "Yosemite Valley": [{"name": "Ursus americanus", "common": "Black Bear", "status": "Native"}],
        "Mekong Delta": [{"name": "Pomacea canaliculata", "common": "Golden Apple Snail", "status": "Invasive"}],
        "Ha Long Bay": [{"name": "Chelonia mydas", "common": "Green Sea Turtle", "status": "Concern"}]
    }
    
    for loc in locations:
        sample = Sample(
            filename=loc["filename"],
            region=loc["region"],
            country=loc["country"],
            latitude=loc["lat"],
            longitude=loc["lng"],
            habitat_type=loc["habitat"],
            sample_type="eDNA Sequence",
            status=loc["status"]
        )
        db.add(sample)
        db.flush()
        
        # Add diverse mock species based on the regional profile
        profile = regional_profiles.get(loc["region"], [{"name": "Unknown Species", "common": "Unknown", "status": "Native"}])
        
        if loc["status"] == "Completed" or loc["status"] == "Processing":
            for s in profile:
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
