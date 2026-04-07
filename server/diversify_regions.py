import sqlite3
import datetime
import random

db_path = 'edna_intelligence.db'

def diversify():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Define professional hotspots for a biological surveillance system
    regions = [
        ("Ganga Delta", 22.5, 89.1, "Deltaic Ecosystem"),
        ("Western Ghats Reserve", 10.8, 76.6, "Rainforest Biodiversity"),
        ("National Park System", 29.5, 78.4, "Terrestrial Wildlife Corridor"),
        ("Mekong Delta Zone", 10.2, 105.8, "Tropical Wetland")
    ]

    print("Adding professional variety to BIOSCOPE monitor...")

    for name, lat, lng, habitat in regions:
        # Create a new sample for this region
        sampling_date = (datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 10))).isoformat()
        c.execute("""
            INSERT INTO samples (filename, region, latitude, longitude, sampling_date, sample_type, habitat_type, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (f"DNA_SWEEP_{name.replace(' ', '_').upper()}_001.fastq", name, lat, lng, sampling_date, "Water eDNA", habitat, "Completed", datetime.datetime.utcnow().isoformat()))
        sample_id = c.lastrowid

        # Insert typical species for this professional region profile
        if "Delta" in name:
            # Aquatic focus
            species = [
                ("Orcaella brevirostris", "Irrawaddy Dolphin", "Endangered", 3),
                ("Gavialis gangeticus", "Gharial", "Endangered", 12),
                ("Eichhornia crassipes", "Water Hyacinth", "Invasive", 850),
                ("Tenualosa ilisha", "Hilsa Shad", "Native", 210)
            ]
        elif "Ghats" in name:
            # Forest focus
            species = [
                ("Macaca silenus", "Lion-tailed Macaque", "Endangered", 8),
                ("Nasikabatrachus sahyadrensis", "Purple Frog", "Rare", 5),
                ("Mikania micrantha", "Mile-a-minute Weed", "Invasive", 600),
                ("Elephas maximus", "Asian Elephant", "Native", 15)
            ]
        else:
            # General wildlife corridor
            species = [
                ("Panthera tigris", "Tiger", "Endangered", 2),
                ("Tetracerus quadricornis", "Four-horned Antelope", "Rare", 7),
                ("Lantana camara", "Spanish Flag", "Invasive", 980),
                ("Axis axis", "Chital", "Native", 450)
            ]

        for s_name, c_name, status, count in species:
            c.execute("""
                INSERT INTO species_results (sample_id, species_name, common_name, taxonomic_id, taxonomy_rank, physical_description, preferred_habitat, climate_conditions, geographic_region, diet, behavior, migration_pattern, count, confidence, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (sample_id, s_name, c_name, f"NCBI-{random.randint(1000, 9999)}", "Species", "DNA identified.", habitat, "Variable", name, "Variable", "Variable", "Variable", count, 0.99, status))

            # Generate an alert for this scientific event
            alert_type = "Critical Alert" if status == "Invasive" else "Conservation Priority" if status == "Endangered" else "Biological Discovery"
            prefix = status
            message = f"BioScope Warning: {prefix} {s_name} identification confirmed in {name}."
            
            c.execute("INSERT INTO alerts (type, message, species_involved, location, timestamp, is_resolved) VALUES (?, ?, ?, ?, ?, 0)",
                      (alert_type, message, s_name, name, datetime.datetime.utcnow().isoformat()))

    conn.commit()
    conn.close()
    print("Dashboard now has 5 major Bio-Regions.")

if __name__ == "__main__":
    diversify()
