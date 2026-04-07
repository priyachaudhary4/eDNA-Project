from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import random

db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
engine = create_engine(f"sqlite:///{db_path}")
SessionLocal = sessionmaker(bind=engine)

from sqlalchemy import Table, MetaData, update
metadata = MetaData()
metadata.reflect(bind=engine)

species_results_table = metadata.tables['species_results']

with engine.connect() as conn:
    # Get all results that are currently 'Native'
    from sqlalchemy import select
    results = conn.execute(select(species_results_table).where(species_results_table.c.status == 'Native')).fetchall()
    print(f"Updating {len(results)} records to include rare detections...")
    
    for r in results:
        new_status = 'Native'
        _rand = random.random()
        if r.count == 1 and _rand < 0.1:
            new_status = 'Rare'
        elif r.count > 10 and _rand < 0.05:
            new_status = 'Invasive'
        elif _rand < 0.02:
            new_status = 'Endangered'
            
        if new_status != 'Native':
            conn.execute(update(species_results_table).where(species_results_table.c.id == r.id).values(status=new_status))
    conn.commit()
print("Database updated with demo-friendly status variations.")
