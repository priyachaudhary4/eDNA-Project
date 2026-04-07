from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
engine = create_engine(f"sqlite:///{db_path}")

from sqlalchemy import Table, MetaData, update, select
metadata = MetaData()
metadata.reflect(bind=engine)

species_results_table = metadata.tables['species_results']

with engine.connect() as conn:
    # Set Silver Carp or some other species to Invasive
    # Let's find some records and force them to be Invasive
    res = conn.execute(select(species_results_table).limit(10)).fetchall()
    
    # We will pick 5 random records and set them to Invasive
    for i in range(5):
        conn.execute(update(species_results_table).where(species_results_table.c.id == res[i].id).values(status='Invasive'))
    
    # Also if Silver Carp is in the list, make it invasive
    conn.execute(update(species_results_table).where(species_results_table.c.species_name.like('%Silver Carp%')).values(status='Invasive'))
    
    conn.commit()
print("Force-updated 5 records to 'Invasive' status.")
