import sqlite3
import os

db_paths = [
    'c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/server/edna_intelligence.db',
    'c:/Users/Priya_Chaudhary/OneDrive/Desktop/eDNA/edna_intelligence.db'
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Checking DB at: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Tables: {tables}")
        for table in tables:
            t_name = table[0]
            if t_name == "species_results":
                cursor.execute(f"SELECT species_name, common_name FROM {t_name} LIMIT 5")
                print(f"Content of {t_name}: {cursor.fetchall()}")
        conn.close()
    else:
        print(f"DB not found at: {db_path}")
