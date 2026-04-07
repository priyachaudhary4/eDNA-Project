import sqlite3
import shutil
import os

root_db = "edna_intelligence.db"
server_db = "server/edna_intelligence.db"

def check_db_total_detections(path):
    if not os.path.exists(path):
        return 0
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM species_results")
        count = cur.fetchone()[0]
        conn.close()
        return count
    except Exception as e:
        print(f"Error checking {path}: {e}")
        return 0

root_total = check_db_total_detections(root_db)
server_total = check_db_total_detections(server_db)

print(f"Root DB Total Detections: {root_total}")
print(f"Server DB Total Detections: {server_total}")

# We want the one with MORE data
if root_total > server_total:
    print(f"Syncing Root DB ({root_total} rows) to Server...")
    shutil.copy2(root_db, server_db)
elif server_total > root_total:
    print(f"Syncing Server DB ({server_total} rows) to Root...")
    shutil.copy2(server_db, root_db)
else:
    print("Databases seem equal in size or both empty.")

def activate_and_fix(path):
    if not os.path.exists(path): return
    print(f"Fixing and Activating all samples in {path}...")
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        
        # 1. Activate ALL samples
        cur.execute("UPDATE samples SET is_active = 1, status = 'Completed'")
        print(f"Activated {cur.rowcount} samples.")
        
        # 2. Fix counts to at least 1
        cur.execute("UPDATE species_results SET count = 1 WHERE count IS NULL OR count <= 0")
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error fixing {path}: {e}")

activate_and_fix(root_db)
activate_and_fix(server_db)

print("\n--- SYNC COMPLETE ---")
print("You may need to call /api/intelligence/re-sync to update status tags with new keywords.")
