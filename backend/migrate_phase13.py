import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    
    # Avenue 1
    cursor.execute('ALTER TABLE deliveries ADD COLUMN crypto_signature VARCHAR(255) NULL')
    
    # Avenue 3
    cursor.execute('ALTER TABLE drones ADD COLUMN battery_health_pct FLOAT DEFAULT 100.0')
    
    conn.commit()
    print("Phase 13 Migration successful: Added crypto_signature, battery_health_pct")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
