import sqlite3

try:
    conn = sqlite3.connect('drone_mission_control.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE users ADD COLUMN tustar_tokens INTEGER DEFAULT 0')
    conn.commit()
    print("Migration successful: Added tustar_tokens to users")
except Exception as e:
    print(f"Error (maybe already exists?): {e}")
finally:
    conn.close()
