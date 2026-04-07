
import sqlite3
import os

db_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Find some species to mark as invasive if they exist
cur.execute("UPDATE species_results SET status = 'Invasive' WHERE common_name IN ('Pacific Salmon', 'Skipjack Tuna', 'Yellowfin Tuna', 'Tuna', 'Shark', 'Pangolin', 'Raccoon')")
conn.commit()
print(f"Updated {cur.rowcount} species to Invasive")

# Verify
cur.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print(cur.fetchall())
conn.close()
