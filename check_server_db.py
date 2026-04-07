
import os
import sys

# Add server to path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'server')))

from db.base import DB_PATH
print(f"DB_PATH from base.py: {DB_PATH}")
print(f"Exists: {os.path.exists(DB_PATH)}")

import sqlite3
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM samples WHERE is_active=1")
print(f"Active Samples in that DB: {cur.fetchone()[0]}")
conn.close()
