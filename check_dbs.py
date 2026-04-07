import sqlite3
import os

root_db = 'edna_intelligence.db'
server_db = os.path.join('server', 'edna_intelligence.db')

for db_path in [root_db, server_db]:
    if os.path.exists(db_path):
        print(f"Checking {db_path}...")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        print(f"  Tables: {tables}")
        for table in tables:
            t = table[0]
            c.execute(f"SELECT COUNT(*) FROM {t}")
            count = c.fetchone()[0]
            print(f"    Table {t}: {count} rows")
        conn.close()
    else:
        print(f"{db_path} does not exist.")
