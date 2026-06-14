import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    
    # Avenue 3
    cursor.execute('ALTER TABLE users ADD COLUMN is_franchise BOOLEAN DEFAULT 0')
    cursor.execute('ALTER TABLE users ADD COLUMN franchise_earnings FLOAT DEFAULT 0.0')
    
    conn.commit()
    print("Phase 11 Migration successful: Added is_franchise, franchise_earnings")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
