
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Count distinct species names with status 'Endangered'
cursor.execute("SELECT COUNT(DISTINCT species_name) FROM species_results JOIN samples ON species_results.sample_id = samples.id WHERE samples.is_active = 1 AND species_results.status = 'Endangered'")
distinct_species = cursor.fetchone()[0]

# Count unique species_name, geographic_region pairs with status 'Endangered'
cursor.execute("SELECT COUNT(*) FROM (SELECT species_name, geographic_region FROM species_results JOIN samples ON species_results.sample_id = samples.id WHERE samples.is_active = 1 AND species_results.status = 'Endangered' GROUP BY species_name, geographic_region)")
species_region_pairs = cursor.fetchone()[0]

# Count alerts
cursor.execute("SELECT COUNT(*) FROM alerts")
total_alerts = cursor.fetchone()[0]

# Count alerts that match 'Conservation' filter in frontend
# alert.type.toLowerCase().includes('conservation') || alert.type.toLowerCase().includes('priority') || alert.type.toLowerCase().includes('warning')
cursor.execute("SELECT COUNT(*) FROM alerts WHERE lower(type) LIKE '%conservation%' OR lower(type) LIKE '%priority%' OR lower(type) LIKE '%warning%'")
conservation_alerts = cursor.fetchone()[0]

print(f"Distinct Endangered Species: {distinct_species}")
print(f"Endangered Species-Region Pairs: {species_region_pairs}")
print(f"Total Alerts: {total_alerts}")
print(f"Conservation Alerts: {conservation_alerts}")

conn.close()
