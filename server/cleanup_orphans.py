
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all species effectively present in species_results
cursor.execute("SELECT DISTINCT species_name FROM species_results")
present_species = set(row[0] for row in cursor.fetchall())

# Get all alerts
cursor.execute("SELECT id, species_involved FROM alerts")
alerts = cursor.fetchall()

to_delete = []
for aid, species in alerts:
    if species not in present_species:
        to_delete.append(aid)

if to_delete:
    print(f"Deleting orphaned alerts: {to_delete}")
    for aid in to_delete:
        cursor.execute("DELETE FROM alerts WHERE id = ?", (aid,))
    conn.commit()
    print("Cleanup complete.")
else:
    print("No orphaned alerts found.")

conn.close()
