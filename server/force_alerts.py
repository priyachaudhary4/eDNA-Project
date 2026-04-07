import sqlite3
import datetime
import os

db_path = 'edna_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get top species
query = """
    SELECT r.species_name, r.status, r.geographic_region 
    FROM species_results r
    JOIN samples s ON r.sample_id = s.id
    WHERE s.is_active = 1 AND r.status IN ('Endangered', 'Invasive', 'Rare')
    GROUP BY r.species_name, r.status, r.geographic_region
    ORDER BY SUM(r.count) DESC
    LIMIT 10
"""
c.execute(query)
results = c.fetchall()

print(f"Generating {len(results)} alerts manually...")

# Clear old alerts first
c.execute("DELETE FROM alerts")

for s_name, s_status, s_region in results:
    alert_type = "Critical Alert"
    prefix = "Invasive"
    
    if s_status == "Endangered":
        alert_type = "Conservation Priority"
        prefix = "Endangered"
    elif s_status == "Rare":
        alert_type = "Biological Discovery"
        prefix = "Rare"
        
    message = f"BioScope Detection: {prefix} {s_name} confirmed in {s_region}."
    timestamp = datetime.datetime.utcnow().isoformat()
    
    c.execute("INSERT INTO alerts (type, message, species_involved, location, timestamp, is_resolved) VALUES (?, ?, ?, ?, ?, 0)",
              (alert_type, message, s_name, s_region, timestamp))

conn.commit()
conn.close()
print("Manual alert generation complete.")
