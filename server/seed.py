from db.base import SessionLocal, engine, Base
from models.database_models import User, Sample, SpeciesResult, Alert
from services.bio_engine import BiodiversityEngine
import datetime

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create Default Admin for BioScope
    admin = User(
        email="admin@bioscope.ai",
        full_name="Dr. Sarah Chen",
        role="Administrator",
        hashed_password="hashed_placeholder_123"
    )
    db.add(admin)

    # Pre-populate some Samples
    sample1 = Sample(
        filename="BRM_2026_01.fastq",
        region="Brahmaputra Basin",
        latitude=26.1158,
        longitude=91.7086,
        sample_type="Water eDNA",
        habitat_type="Freshwater Ecosystem",
        status="Completed"
    )
    db.add(sample1)
    db.commit()

    # Add Results for Sample 1 with full BioScope profiles
    results = [
        SpeciesResult(
            sample_id=sample1.id, 
            species_name="Panthera tigris", 
            common_name="Royal Bengal Tiger",
            taxonomic_id="NCBI:9694", 
            taxonomy_rank="Species",
            physical_description="Large stripe-patterned predator.",
            preferred_habitat="Mangroves & Dense Forest",
            diet="Carnivore",
            behavior="Nocturnal",
            count=2, 
            confidence=0.98, 
            status="Endangered"
        ),
        SpeciesResult(
            sample_id=sample1.id, 
            species_name="Hypophthalmichthys molitrix", 
            common_name="Silver Carp",
            taxonomic_id="NCBI:1597", 
            taxonomy_rank="Species",
            physical_description="High-jumping invasive planktivore.",
            preferred_habitat="River Channels",
            diet="Planktivore",
            behavior="Social",
            count=145, 
            confidence=0.99, 
            status="Invasive"
        ),
    ]
    for r in results: db.add(r)
    
    # Add a BioScope AI engine Alert
    alert = Alert(
        type="Critical Alert",
        message="BioScope Detection: Invasive Silver Carp confirmed in Sector B2.",
        species_involved="Silver Carp",
        location="Sector B2 - Brahmaputra",
        timestamp=datetime.datetime.now()
    )
    db.add(alert)

    db.commit()
    db.close()
    print("BioScope Database initialized with ecological intelligence data.")

if __name__ == "__main__":
    seed_data()
