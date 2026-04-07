from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from db.base import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    RESEARCHER = "Researcher"
    AUTHORITY = "Authority"
    ANALYST = "Analyst"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default=UserRole.RESEARCHER)
    is_active = Column(Integer, default=1)

class Sample(Base):
    __tablename__ = "samples"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    country = Column(String, default="Unknown")
    region = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    sampling_date = Column(DateTime, default=datetime.datetime.utcnow)
    sample_type = Column(String) # Hair DNA, Tissue DNA, Water eDNA, Soil DNA
    habitat_type = Column(String)
    status = Column(String, default="Pending") # Pending, Processing, Completed, Failed
    is_active = Column(Integer, default=1)
    batch_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    results = relationship("SpeciesResult", back_populates="sample")

class SpeciesResult(Base):
    __tablename__ = "species_results"
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("samples.id"), index=True)
    species_name = Column(String) # Scientific Name
    common_name = Column(String)
    taxonomic_id = Column(String)
    taxonomy_rank = Column(String) # Kingdom, Phylum, etc.
    physical_description = Column(String)
    preferred_habitat = Column(String)
    climate_conditions = Column(String)
    geographic_region = Column(String)
    diet = Column(String) # Herbivore, etc.
    behavior = Column(String) # Nocturnal, etc.
    migration_pattern = Column(String)
    count = Column(Integer)
    confidence = Column(Float)
    status = Column(String) # Native, Invasive, Rare, Endangered, Vulnerable, Extinct
    
    sample = relationship("Sample", back_populates="results")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # Critical, Warning, Discovery
    message = Column(String)
    species_involved = Column(String)
    location = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_resolved = Column(Integer, default=0)
