
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all species in species_results
cursor.execute("SELECT DISTINCT species_name FROM species_results")
all_species = set(row[0] for row in cursor.fetchall())

# Find alerts with species not in all_species
cursor.execute("SELECT id, species_involved, type FROM alerts")
all_alerts = cursor.fetchall()

orphans = []
for aid, species, atype in all_alerts:
    if species not in all_species:
        orphans.append((aid, species, atype))

print(f"Orphaned Alerts: {orphans}")

conn.close()
