import sqlite3
import os

# 🛰️ THE TUSTAR DATABASE SYNCHRONIZER
# Ensures the SQLite mission registry is compatible with the latest tactical schema.

DB_PATH = os.path.join(os.path.dirname(__file__), "app", "sql_app.db")

def sync():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get current columns
    cursor.execute("PRAGMA table_info(deliveries)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"🛰️ Current mission columns: {columns}")

    # Add estimated_cost if missing
    if "estimated_cost" not in columns:
        print("🛠️ Adding 'estimated_cost' column...")
        try:
            cursor.execute("ALTER TABLE deliveries ADD COLUMN estimated_cost FLOAT DEFAULT 0.0")
            print("✅ Successfully added 'estimated_cost'.")
        except Exception as e:
            print(f"❌ Error adding 'estimated_cost': {e}")

    # Add scheduled_at if missing
    if "scheduled_at" not in columns:
        print("🛠️ Adding 'scheduled_at' column...")
        try:
            # SQLite doesn't directly support DateTime with timezone cleanly in ALTER, 
            # but we can add it as a string or handle it via SQLAlchemy later.
            cursor.execute("ALTER TABLE deliveries ADD COLUMN scheduled_at DATETIME")
            print("✅ Successfully added 'scheduled_at'.")
        except Exception as e:
            print(f"❌ Error adding 'scheduled_at': {e}")

    conn.commit()
    conn.close()
    print("🛰️ Tustar Mission Registry Synchronization Complete. Ops Restored.")

if __name__ == "__main__":
    sync()
