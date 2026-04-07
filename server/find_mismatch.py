
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Find all alerts that are NOT endangered species but match the filter
# endangered species list:
cursor.execute("SELECT species_name FROM species_results WHERE status = 'Endangered' GROUP BY species_name")
endangered_names = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT id, type, species_involved, message FROM alerts WHERE lower(type) LIKE '%conservation%' OR lower(type) LIKE '%priority%' OR lower(type) LIKE '%warning%'")
conservation_alerts = cursor.fetchall()

print("Alerts matching 'Conservation' filter but NOT in Endangered Species List:")
for aid, atype, aspecies, amsg in conservation_alerts:
    if aspecies not in endangered_names:
        print(f"ID: {aid}, Type: {atype}, Species: {aspecies}, Message: {amsg}")

conn.close()
