import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE users ADD COLUMN is_prime BOOLEAN DEFAULT 0')
    conn.commit()
    print("Migration successful: Added is_prime to users")
except Exception as e:
    print(f"Error (maybe already exists?): {e}")
finally:
    conn.close()
