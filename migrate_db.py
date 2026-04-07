import sqlite3
import os

db_path = os.path.join('server', 'edna_intelligence.db')

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if country already exists
        cursor.execute("PRAGMA table_info(samples)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'country' not in columns:
            print("Adding 'country' column to 'samples' table...")
            cursor.execute("ALTER TABLE samples ADD COLUMN country VARCHAR DEFAULT 'Unknown'")
            conn.commit()
            print("Migration successful.")
        else:
            print("'country' column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
