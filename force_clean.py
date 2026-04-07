import sqlite3
import os

db_paths = [
    r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db",
    r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\edna_intelligence.db"
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Cleaning {db_path}...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM species_results")
            cursor.execute("DELETE FROM samples")
            cursor.execute("DELETE FROM alerts")
            # Keep users for login
            conn.commit()
            conn.close()
            print("Successfully cleaned.")
        except Exception as e:
            print(f"Error cleaning {db_path}: {e}")
    else:
        print(f"Path {db_path} does not exist.")
