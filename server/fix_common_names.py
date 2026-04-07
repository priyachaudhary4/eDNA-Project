"""Fix any malformed common_name entries in the database."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'edna_intelligence.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Common name mapping for known species
common_name_map = {
    "loxodonta africana": "African Elephant",
    "loxodonta africana africana": "African Bush Elephant",
    "panthera tigris": "Royal Bengal Tiger",
    "canis lupus": "Gray Wolf",
    "rhinoceros unicornis": "One-horned Rhinoceros",
    "alligator mississippiensis": "American Alligator",
    "lycaon pictus": "African Wild Dog",
    "thunnus alalunga": "Albacore Tuna",
    "inia geoffrensis": "Amazon River Dolphin",
    "scientific name inia geoffrensis": "Amazon River Dolphin",
}

# Fix entries where common_name starts with "Scientific Name" or matches species_name
cursor.execute("SELECT id, species_name, common_name FROM species_results")
rows = cursor.fetchall()
fixed = 0
for row in rows:
    rid, species_name, common_name = row
    needs_fix = False
    new_common = common_name

    # Fix "Scientific Name ..." prefix
    if common_name and common_name.lower().startswith("scientific name"):
        needs_fix = True
    # Fix when common_name == species_name (just showing scientific name)
    elif common_name and common_name.strip().lower() == species_name.strip().lower():
        needs_fix = True
    # Fix when common_name is empty
    elif not common_name or common_name.strip() == "":
        needs_fix = True

    if needs_fix:
        new_common = common_name_map.get(species_name.strip().lower(), species_name.split(' ')[0].title())
        cursor.execute("UPDATE species_results SET common_name = ? WHERE id = ?", (new_common, rid))
        fixed += 1
        print(f"  Fixed: '{species_name}' -> common_name: '{new_common}'")

conn.commit()
print(f"\nDone! Fixed {fixed} entries.")

# Show final state
cursor.execute("SELECT DISTINCT species_name, common_name FROM species_results")
print("\nCurrent species -> common_name mapping:")
for row in cursor.fetchall():
    print(f"  {row[0]:40s} -> {row[1]}")

conn.close()
