import sqlite3
import os

db_path = r"c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, filename FROM samples")
    rows = cursor.fetchall()
    print(f"Total Samples: {len(rows)}")
    for r in rows:
        print(f"ID: {r[0]}, File: {r[1]}")
except Exception as e:
    print(f"Error checking DB: {e}")
finally:
    conn.close()
