import sqlite3
import os

db_path = os.path.join('server', 'edna_intelligence.db')

def update_countries():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Update India
        cursor.execute("UPDATE samples SET country = 'India' WHERE region LIKE '%Brahmaputra%' OR region LIKE '%Ganga%' OR region LIKE '%Western Ghats%'")
        # Update USA
        cursor.execute("UPDATE samples SET country = 'USA' WHERE region LIKE '%Yellowstone%' OR region LIKE '%Everglades%' OR region LIKE '%National Park%'")
        # Update Vietnam
        cursor.execute("UPDATE samples SET country = 'Vietnam' WHERE region LIKE '%Mekong%'")
        # Default others
        cursor.execute("UPDATE samples SET country = 'India' WHERE country = 'Unknown'")
        
        conn.commit()
        print("Updated sample countries successfully.")
            
    except Exception as e:
        print(f"Update failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_countries()
