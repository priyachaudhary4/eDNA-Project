from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class SpeciesResultBase(BaseModel):
    species_name: str
    common_name: Optional[str] = None
    taxonomic_id: Optional[str] = "BIO-UNKNOWN"
    taxonomy_rank: Optional[str] = None
    physical_description: Optional[str] = None
    preferred_habitat: Optional[str] = None
    climate_conditions: Optional[str] = None
    geographic_region: Optional[str] = None
    diet: Optional[str] = None
    behavior: Optional[str] = None
    migration_pattern: Optional[str] = None
    count: Optional[int] = 1
    confidence: Optional[float] = 0.0
    status: Optional[str] = "Detected"

class SampleBase(BaseModel):
    filename: Optional[str] = "unknown_file"
    country: Optional[str] = "Unknown"
    region: Optional[str] = "Unknown"
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    sampling_date: Optional[datetime] = None
    habitat_type: Optional[str] = "Unknown"
    sample_type: Optional[str] = "eDNA"

class SampleResponse(SampleBase):
    id: int
    status: Optional[str] = "Pending"
    is_active: Optional[int] = 1
    batch_id: Optional[str] = None
    created_at: Optional[datetime] = None
    results: List[SpeciesResultBase] = []
    class Config:
        from_attributes = True

class SampleListResponse(SampleBase):
    id: int
    status: Optional[str] = "Pending"
    is_active: Optional[int] = 1
    batch_id: Optional[str] = None
    created_at: Optional[datetime] = None
    detection_count: int = 0
    results: List[SpeciesResultBase] = []
    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    type: Optional[str] = "Info"
    message: Optional[str] = ""
    species_involved: Optional[str] = "Unknown"
    location: Optional[str] = "Unknown Region"
    timestamp: Optional[datetime] = None
    is_resolved: Optional[int] = 0
    class Config:
        from_attributes = True

class DiversityMetrics(BaseModel):
    samples_processed: int
    species_richness: int
    shannon_index: float
    simpson_index: float
    evenness: float
    rare_species: int
    invasive_species: int
    endangered_species: int
    species_of_concern: int
    richness_trend: Optional[float] = 0.0
    rare_trend: Optional[float] = 0.0
    invasive_trend: Optional[float] = 0.0
    endangered_trend: Optional[float] = 0.0
    total_detections: Optional[int] = 0
    trend_data: List[dict] = []
