import sqlite3
import os

db_path = 'edna_intelligence.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Database: {db_path}")
    for table_name in tables:
        t = table_name[0]
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"Table {t}: {count} rows")
    
    cursor.execute("SELECT id, filename, status, is_active FROM samples")
    print("\nSamples:")
    print(cursor.fetchall())
    
    conn.close()
else:
    print(f"Database {db_path} not found")
