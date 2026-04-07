import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.base import Base # We still need the Base for models
from models.database_models import User, Sample, SpeciesResult, Alert

# Force the correct absolute path to the actual DB file in /server/
DB_PATH = os.path.join(os.path.dirname(__file__), "edna_intelligence.db")
SQL_URL = f"sqlite:///{DB_PATH}"

def reset_database():
    print(f"Targeting Database: {DB_PATH}")
    engine = create_engine(SQL_URL, connect_args={"check_same_thread": False})
    
    print("Resetting BioScope Database to neutral state...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Create Default Admin only
    admin = User(
        email="admin@bioscope.ai",
        full_name="Dr. Sarah Chen",
        role="Administrator",
        hashed_password="hashed_placeholder_123"
    )
    db.add(admin)
    db.commit()
    db.close()
    
    print("Database cleared. Neutral system state achieved.")
    print("Admin account 'admin@bioscope.ai' restored.")

if __name__ == "__main__":
    reset_database()
