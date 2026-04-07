import sqlite3
db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id, species_name FROM species_results")
rows = cursor.fetchall()
print(f"Species Results: {len(rows)}")
for r in rows:
    print(r)
conn.close()
