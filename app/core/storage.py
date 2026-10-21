import sqlite3

DB_FILE = "assistant_local.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS finances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced_to_google INTEGER DEFAULT 0
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date_str TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced_to_google INTEGER DEFAULT 0
        )
    """)
    
    conn.commit()
    conn.close()

def save_financial_metric(metric):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO finances (type, amount, category, timestamp) VALUES (?, ?, ?, ?)",
        (metric.type, metric.amount, metric.category, metric.timestamp.isoformat())
    )
    conn.commit()
    conn.close()

def save_calendar_event(event):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO calendar_events (title, date_str, timestamp) VALUES (?, ?, ?)",
        (event.title, event.date_str, event.timestamp.isoformat())
    )
    conn.commit()
    conn.close()

def get_financial_summary(limit=5):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT type, amount, category, timestamp FROM finances ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_calendar_summary(limit=5):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT title, date_str FROM calendar_events ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return rows