import sqlite3
import datetime
import os

db_path = 'edna_intelligence.db'

if not os.path.exists(db_path):
    print("Database missing.")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Clear old alerts to avoid clutter
c.execute("DELETE FROM alerts")

# Find top species for each priority status
query = "SELECT species_name, status, geographic_region FROM species_results WHERE status IN ('Endangered', 'Invasive', 'Rare') ORDER BY count DESC LIMIT 15"
c.execute(query)
results = c.fetchall()

print(f"Generating {len(results)} scientific alerts...")

for spec_name, status, region in results:
    alert_type = "Critical Alert"
    prefix = "Invasive"
    
    if status == "Endangered":
        alert_type = "Conservation Priority"
        prefix = "Endangered"
    elif status == "Rare":
        alert_type = "Biological Discovery"
        prefix = "Rare"
        
    message = f"BioScope Warning: {prefix} {spec_name} identification confirmed in {region}."
    timestamp = datetime.datetime.utcnow().isoformat()
    
    c.execute("INSERT INTO alerts (type, message, species_involved, location, timestamp, is_resolved) VALUES (?, ?, ?, ?, ?, 0)",
              (alert_type, message, spec_name, region, timestamp))

conn.commit()
conn.close()
print("Alert modernization complete.")
