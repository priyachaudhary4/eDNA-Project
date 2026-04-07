import sqlite3
import os

db_path = 'edna_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check samples
print("--- SAMPLES ---")
c.execute("SELECT id, is_active FROM samples")
samples = c.fetchall()
for s in samples:
    print(s)

# Check species results for active samples
print("\n--- SPECIES RESULTS (ACTIVE) ---")
c.execute("""
    SELECT r.species_name, r.status, r.geographic_region, r.count 
    FROM species_results r
    JOIN samples s ON r.sample_id = s.id
    WHERE s.is_active = 1 AND r.status IN ('Endangered', 'Invasive', 'Rare')
""")
results = c.fetchall()
for r in results:
    print(r)

# Check alerts
print("\n--- FINAL ALERTS ---")
c.execute("SELECT * FROM alerts")
alerts = c.fetchall()
for a in alerts:
    print(a)

conn.close()
