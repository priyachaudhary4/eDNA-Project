"""Fix the 'Scientific Name Inia geoffrensis' species_name entry."""
import sqlite3, os

db_path = os.path.join(os.path.dirname(__file__), 'edna_intelligence.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fix the species_name that has "Scientific Name" prefix
cursor.execute(
    "UPDATE species_results SET species_name = 'Inia geoffrensis' WHERE species_name LIKE 'Scientific Name%'"
)
print(f"Fixed {cursor.rowcount} entries with 'Scientific Name' prefix")
conn.commit()

# Verify
cursor.execute("SELECT species_name, common_name FROM species_results WHERE common_name = 'Amazon River Dolphin'")
print(f"After fix: {cursor.fetchall()}")
conn.close()
