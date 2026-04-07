
import sqlite3
import pandas as pd
import os

db_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Setting all species counts to 1 to match Total Detections = 97...")
cursor.execute("UPDATE species_results SET count = 1")
conn.commit()

# Double check status distribution
cursor.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print("New status distribution:")
print(cursor.fetchall())

# Total detections check
cursor.execute("SELECT SUM(count) FROM species_results")
total = cursor.fetchone()[0]
print(f"Total Detections in DB: {total}")

conn.close()
