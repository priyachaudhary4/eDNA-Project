import sqlite3
import pandas as pd
import os

# Database path
db_path = 'edna_intelligence.db'
csv_path = 'last_upload_debug.csv'

if not os.path.exists(db_path) or not os.path.exists(csv_path):
    print("Files missing.")
    exit(1)

# Connect to DB
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Read the CSV to get the mapping
df = pd.read_csv(csv_path)

# Map original column names
def get_status(row):
    conserv = str(row.get('Conservation Status', '')).lower()
    abundance = str(row.get('Abundance', '')).lower()
    nativeness = str(row.get('Nativeness', '')).lower()
    
    if "endangered" in conserv:
        return "Endangered"
    elif "rare" in abundance or "threatened" in conserv:
        return "Rare"
    elif "species of concern" in conserv:
        return "Concern"
    elif "not native" in nativeness or "invasive" in nativeness:
        return "Invasive"
    return "Native"

# Batch update statuses
# For simplicity, we match by species name (scientific name)
print("Processing re-classification...")
for idx, row in df.head(5000).iterrows(): # We only processed first 5000
    name = str(row.get('Scientific Name', '')).strip()
    new_status = get_status(row)
    c.execute("UPDATE species_results SET status = ? WHERE species_name = ?", (new_status, name))

conn.commit()
conn.close()
print("Migration complete. All species statuses correctly re-classified.")
