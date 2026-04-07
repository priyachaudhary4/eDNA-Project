
import sqlite3
import os

db_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Species Results Summary ---")
cursor.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print(cursor.fetchall())

print("\n--- Sample Summary ---")
cursor.execute("SELECT id, filename, is_active FROM samples")
print(cursor.fetchall())

print("\n--- Invasive Species in DB ---")
cursor.execute("SELECT species_name, common_name FROM species_results WHERE status = 'Invasive'")
print(cursor.fetchall())

print("\n--- Column detection check (First 5 rows of Species Results) ---")
cursor.execute("SELECT * FROM species_results LIMIT 5")
cols = [description[0] for description in cursor.description]
print(cols)
for row in cursor.fetchall():
    print(dict(zip(cols, row)))

conn.close()
