import sqlite3

conn = sqlite3.connect('edna_intelligence.db')
c = conn.cursor()

# Check samples with coordinates
print("=== SAMPLES WITH COORDINATES ===")
c.execute("SELECT id, region, country, latitude, longitude, status FROM samples WHERE is_active=1 AND latitude IS NOT NULL AND latitude != 0 LIMIT 10")
for row in c.fetchall():
    print(row)

print("\n=== SPECIES RESULTS COUNT PER SAMPLE ===")
c.execute("""
    SELECT s.id, s.region, s.latitude, s.longitude, COUNT(sr.id) as hits
    FROM samples s
    LEFT JOIN species_results sr ON sr.sample_id = s.id
    WHERE s.is_active=1
    GROUP BY s.id
    HAVING s.latitude IS NOT NULL AND s.latitude != 0
    LIMIT 10
""")
for row in c.fetchall():
    print(row)

print("\n=== TOTAL SAMPLES:", )
c.execute("SELECT COUNT(*) FROM samples")
print(c.fetchone())

print("=== TOTAL SPECIES RESULTS:")
c.execute("SELECT COUNT(*) FROM species_results")
print(c.fetchone())

print("\n=== SAMPLE IDs WITH SPECIES RESULTS:")
c.execute("SELECT DISTINCT sample_id FROM species_results LIMIT 10")
print([r[0] for r in c.fetchall()])

print("\n=== SAMPLES WITH NO COORDINATES:")
c.execute("SELECT COUNT(*) FROM samples WHERE latitude IS NULL OR latitude = 0")
print(c.fetchone())

conn.close()
