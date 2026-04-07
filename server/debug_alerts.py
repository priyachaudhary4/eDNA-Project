import sqlite3
import os

db_path = 'edna_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("--- TOP HIGH-PRIORITY SPECIES ---")
c.execute("SELECT species_name, status, geographic_region, count FROM species_results WHERE status IN ('Endangered', 'Invasive', 'Rare') ORDER BY count DESC LIMIT 15")
species = c.fetchall()
for s in species:
    print(s)

print("\n--- CURRENT ALERTS ---")
c.execute("SELECT id, type, species_involved, location FROM alerts")
alerts = c.fetchall()
for a in alerts:
    print(a)

conn.close()
