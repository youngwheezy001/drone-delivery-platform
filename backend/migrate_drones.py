import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE drones ADD COLUMN distance_flown_km FLOAT DEFAULT 0.0')
    cursor.execute('ALTER TABLE drones ADD COLUMN needs_maintenance BOOLEAN DEFAULT 0')
    conn.commit()
    print("Migration successful: Added distance_flown_km and needs_maintenance to drones")
except Exception as e:
    print(f"Error (maybe already exists?): {e}")
finally:
    conn.close()
