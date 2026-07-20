import sqlite3
from app.core.parser import AssistantParser
from app.core.storage import init_db, save_financial_metric, save_calendar_event

init_db()

# Simulate text commands
raw_commands = [
    "spend: 14.50 coffee",
    "cal: 2026-09-20 Tech Conference Seminar",
    "spend: 85.00 groceries"
]

print("--- RUNNING INTEGRATED PIPELINE SIMULATION ---\n")

for cmd in raw_commands:
    try:
        # Parse & Validate
        parsed_obj = AssistantParser.parse_text(cmd)
        
        # Determine object type and store locally
        if parsed_obj.__class__.__name__ == "FinancialMetric":
            save_financial_metric(parsed_obj)
            print(f"Stored Financial Metric: {parsed_obj.category} (${parsed_obj.amount})")
        elif parsed_obj.__class__.__name__ == "CalendarEvent":
            save_calendar_event(parsed_obj)
            print(f"Stored Calendar Event: {parsed_obj.title} on {parsed_obj.date_str}")
            
    except Exception as e:
        print(f"Failed to process stream input: {e}")

#Read back from local database to verify persistence
print("\n--- VERIFYING STORAGE DATA STATES ---")
conn = sqlite3.connect("assistant_local.db")
cursor = conn.cursor()

print("\n[Local Finances Table Rows]:")
cursor.execute("SELECT id, type, amount, category FROM finances")
for row in cursor.fetchall():
    print(f"  Row {row[0]} -> {row[1].upper()}: ${row[2]} for {row[3]}")

print("\n[Local Calendar Events Table Rows]:")
cursor.execute("SELECT id, title, date_str FROM calendar_events")
for row in cursor.fetchall():
    print(f"  Row {row[0]} -> Event: '{row[1]}' set for {row[2]}")

conn.close()