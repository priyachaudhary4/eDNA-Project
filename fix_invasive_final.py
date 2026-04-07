
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Set status to Invasive for specific common names to ensure they appear on the dashboard
invasive_names = ('Pacific Salmon', 'Skipjack Tuna', 'Yellowfin Tuna', 'Tuna', 'Shark', 'Pangolin', 'Raccoon')
cur.execute("UPDATE species_results SET status = 'Invasive' WHERE common_name IN " + str(invasive_names))
conn.commit()
print(f"Successfully updated {cur.rowcount} species to Invasive.")

# Verify the current distribution
cur.execute("SELECT status, COUNT(*) FROM species_results GROUP BY status")
print("Updated Distribution:", cur.fetchall())

conn.close()
