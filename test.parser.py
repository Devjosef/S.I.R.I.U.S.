from app.core.parser import AssistantParser

# Sample incoming raw strings (simulating messy emails or text entries)
test_inputs = [
    "spend: 45 lunch",
    "cal: 2026-08-12 Project Deadline Review",
    "income:   150.50   consulting work ",  # Extraneous spacing
    "bad_command: 123 help"                 # Intentional failure
]

print("--- STARTING LOCAL DATA AUDIT --- \n")

for item in test_inputs:
    try:
        parsed_data = AssistantParser.parse_text(item)
        print(f"✓ SUCCESS | Input: '{item}'")
        print(f"  Result Object: {parsed_data.model_dump_json(indent=2)}\n")
    except ValueError as e:
        print(f"✗ REJECTED | Input: '{item}'")
        print(f"  Error Reason: {e}\n")