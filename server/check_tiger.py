
import sqlite3

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT species_name, status FROM species_results WHERE species_name LIKE '%Panthera tigris%'")
results = cursor.fetchall()
print(f"Results for Panthera tigris: {results}")

conn.close()
