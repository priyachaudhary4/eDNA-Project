import sqlite3
import os

db_path = 'edna_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("--- ALERT COUNTS ---")
c.execute("SELECT type, COUNT(*) FROM alerts GROUP BY type")
counts = c.fetchall()
for t, count in counts:
    print(f"{t}: {count}")

print("\n--- SPECIES STATUS COUNTS (ACTIVE) ---")
c.execute("""
    SELECT r.status, COUNT(DISTINCT r.species_name) 
    FROM species_results r
    JOIN samples s ON r.sample_id = s.id
    WHERE s.is_active = 1
    GROUP BY r.status
""")
s_counts = c.fetchall()
for st, count in s_counts:
    print(f"{st}: {count}")

conn.close()
