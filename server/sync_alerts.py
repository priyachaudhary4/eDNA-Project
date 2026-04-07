
import sqlite3
import os
from datetime import datetime

db_path = r'c:\Users\Priya_Chaudhary\OneDrive\Desktop\eDNA\server\edna_intelligence.db'

def full_sync_alerts():
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Clear existing alerts
    cursor.execute("DELETE FROM alerts")
    print("Existing alerts purged.")

    # 1. Generate Case Summary Alerts for each Sample
    cursor.execute("SELECT id, filename, region, country FROM samples WHERE is_active = 1")
    samples = cursor.fetchall()

    for s in samples:
        sample_id = s['id']
        filename = s['filename']
        
        # Get metrics for this specific sample
        cursor.execute("SELECT status, COUNT(*) as qty FROM species_results WHERE sample_id = ? GROUP BY status", (sample_id,))
        stats = {row['status']: row['qty'] for row in cursor.fetchall()}
        
        total = sum(stats.values())
        endangered = stats.get('Endangered', 0)
        rare = stats.get('Rare', 0)
        invasive = stats.get('Invasive', 0)
        concern = stats.get('Concern', 0)
        
        msg = (f"BIO-INTEL SUMMARY: Analysis of '{filename}' complete. "
               f"Total Detections: {total}. "
               f"Extracted: {endangered} Endangered, {invasive} Invasive, {rare} Rare, {concern} Concern.")
        
        cursor.execute("""
            INSERT INTO alerts (type, message, species_involved, location, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, ("Neural Summary", msg, "Multiple Species", s['region'], datetime.now()))

    # 2. Generate Detailed Detailed Alerts for priority species
    cursor.execute("""
        SELECT sr.species_name, sr.common_name, sr.status, s.region, sr.confidence
        FROM species_results sr
        JOIN samples s ON sr.sample_id = s.id
        WHERE sr.status IN ('Endangered', 'Invasive', 'Rare')
        AND s.is_active = 1
    """)
    priority_results = cursor.fetchall()
    
    for sr in priority_results:
        status_label = sr['status']
        scientific = sr['species_name']
        common = sr['common_name']
        region = sr['region']
        conf = int((sr['confidence'] or 0.9) * 100)
        
        alert_type = "Critical Alert" if status_label == "Invasive" else "Conservation Priority"
        if status_label == "Rare": alert_type = "Biological Discovery"
        
        detail_msg = f"DETECTION ALERT: {status_label} species '{scientific}' ({common}) identified in {region} sector with {conf}% fidelity."
        
        cursor.execute("""
            INSERT INTO alerts (type, message, species_involved, location, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (alert_type, detail_msg, scientific, region, datetime.now()))

    conn.commit()
    conn.close()
    print("Alert synchronization with enriched metadata complete.")

if __name__ == "__main__":
    full_sync_alerts()
