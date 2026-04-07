import sqlite3
import datetime

db_path = 'edna_intelligence.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Clear alerts to force re-sync
c.execute("DELETE FROM alerts")

# Ensure we have some samples/species results that match the bar chart logic
# Species from the user's screenshot: Y. Tuna, W. Rhino, etc.
species_data = [
    ('Yellowfin Tuna', 'Endangered', 'Indian Ocean Reef', 850),
    ('Yangtze Finless Porpoise', 'Endangered', 'Ganga Delta', 120),
    ('White Rhino', 'Endangered', 'National Park System', 45),
    ('Whale Shark', 'Endangered', 'Indian Ocean Reef', 230),
    ('Blue Whale', 'Endangered', 'Atlantic Deep Sea', 15),
    ('Southern Rockhopper Penguin', 'Rare', 'Atlantic Deep Sea', 500),
    ('Mountain Plover', 'Rare', 'Western Ghats Reserve', 45),
    ('Marine Iguana', 'Rare', 'Pacific Kelp Forest', 80),
    ('Hippopotamus', 'Rare', 'National Park System', 340),
    ('Great White Shark', 'Rare', 'Indian Ocean Reef', 120),
    ('Silver Carp', 'Invasive', 'Brahmaputra Basin', 1200)
]

# Create a dummy sample
c.execute("INSERT INTO samples (filename, region, is_active, status) VALUES (?, ?, ?, ?)", 
          ('surveillance_report.csv', 'Global', 1, 'Completed'))
sample_id = c.lastrowid

for name, status, region, count in species_data:
    c.execute("""
        INSERT INTO species_results (sample_id, species_name, common_name, status, geographic_region, count, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (sample_id, name, name, status, region, count, 0.99))

conn.commit()
conn.close()
print("Database updated with high-priority tracking species.")
