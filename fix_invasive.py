
import sqlite3
import pandas as pd
import os

db_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db"
csv_path = "c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/last_upload_debug.csv"

if not os.path.exists(csv_path):
    print("CSV not found.")
    exit()

df = pd.read_csv(csv_path)

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

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

updates = 0
for _, row in df.iterrows():
    sci_name = str(row.get('Scientific Name', '')).strip()
    nativeness = str(row.get('Nativeness', 'Native')).strip()
    cons_status = str(row.get('Conservation Status', 'Native')).strip()
    
    # Combined raw status for resolve_status
    raw_status = f"{nativeness} {cons_status}"
    new_status = intelligent_tag(sci_name, raw_status)
    
    cursor.execute("UPDATE species_results SET status = ? WHERE species_name = ?", (new_status, sci_name))
    updates += cursor.rowcount

conn.commit()
print(f"Updated {updates} rows in DB based on CSV analysis.")

cursor.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print("\n--- Final Status Distribution ---")
print(cursor.fetchall())
conn.close()
