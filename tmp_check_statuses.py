from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
engine = create_engine(f"sqlite:///{db_path}")

from sqlalchemy import Table, MetaData, select
metadata = MetaData()
metadata.reflect(bind=engine)

species_results_table = metadata.tables['species_results']

with engine.connect() as conn:
    # Check distinct statuses
    res = conn.execute(select(species_results_table.c.status).distinct()).fetchall()
    print("Distinct Statuses and Counts:")
    for status in res:
        count = conn.execute(select(species_results_table).where(species_results_table.c.status == status[0])).rowcount
        # Wait, rowcount is not reliable for select. Use count(*)
        from sqlalchemy import func
        count = conn.execute(select(func.count()).select_from(species_results_table).where(species_results_table.c.status == status[0])).scalar()
        print(f"Status: '{status[0]}', Count: {count}")
