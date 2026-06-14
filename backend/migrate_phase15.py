import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    
    # Avenue 3: Kinetic Airdrop Flag
    cursor.execute('ALTER TABLE deliveries ADD COLUMN is_rugged_terrain BOOLEAN DEFAULT 0')
    
    conn.commit()
    print("Phase 15 Migration successful: Added is_rugged_terrain")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
