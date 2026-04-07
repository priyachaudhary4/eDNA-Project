
import sqlite3
import os

db_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def resolve_status(val):
    v = str(val).lower().strip()
    if any(x in v for x in ['endangered', 'critically', 'extinct', 'en', 'threatened', 'species of concern']): return 'Endangered'
    if any(x in v for x in ['invasive', 'alien', 'pest', 'inv', 'exotic', 'non-native', 'nonnative', 'introduced', 'not native']): return 'Invasive'
    if any(x in v for x in ['rare', 'vulnerable', 'vu', 'uncommon']): return 'Rare'
    if any(x in v for x in ['concern', 'near', 'lc', 'nt', 'protected']): return 'Concern'
    return 'Native'

def intelligent_tag(name, raw_status):
    n = name.lower()
    if any(x in n for x in ['tigris', 'tiger', 'panda', 'rhino', 'elephant', 'leopard', 'panthera', 'lion', 'whale', 'lynx', 'wolf', 'gorilla']): return 'Endangered'
    if any(x in n for x in ['carpio', 'carp', 'mussel', 'snail', 'invasive', 'weed', 'rat', 'crow', 'toad', 'starling', 'myna', 'feral', 'lantana', 'hyacinth']): return 'Invasive'
    if any(x in n for x in ['mountain', 'snow', 'rare', 'orchid', 'endemic']): return 'Rare'
    return resolve_status(raw_status)

# Fetch all species results
cursor.execute("SELECT id, species_name, status FROM species_results")
rows = cursor.fetchall()

updates = 0
for row_id, name, current_status in rows:
    new_status = intelligent_tag(name, current_status)
    if new_status != current_status:
        cursor.execute("UPDATE species_results SET status = ? WHERE id = ?", (new_status, row_id))
        updates += 1

conn.commit()
print(f"Updated {updates} species statuses.")

# Summary after update
cursor.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print("\n--- New Status Distribution ---")
print(cursor.fetchall())

conn.close()
