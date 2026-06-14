import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    
    # Avenue 2
    cursor.execute('ALTER TABLE deliveries ADD COLUMN is_p2p BOOLEAN DEFAULT 0')
    
    # Avenue 3
    cursor.execute('ALTER TABLE users ADD COLUMN api_key VARCHAR(255) NULL')
    cursor.execute('ALTER TABLE users ADD COLUMN webhook_url VARCHAR(255) NULL')
    
    conn.commit()
    print("Phase 10 Migration successful: Added is_p2p, api_key, webhook_url")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
