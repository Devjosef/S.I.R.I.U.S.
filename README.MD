# S.I.R.I.U.S. Engine

> **Reductionist Personal Assistant Local Pipeline**

S.I.R.I.U.S. is a streamlined, lightweight personal assistant core rebuilt entirely in Python. It handles rigorous text parsing, manages local cache data persistence, and drives a live user interface via standard WebSockets.

---

## System Architecture

The engine runs completely decoupled across four primary application files and is verified by an isolated test suite:

*   **`main.py`**: The central FastAPI application core. It manages the REST API endpoints, acts as the WebSocket stream hub, and serves the frontend assets dynamically.
*   **`parser.py`**: The natural language intent parsing layer. Backed by Pydantic validation rules, it sanitizes inputs and routes commands using strict regular expressions.
*   **`storage.py`**: The data layer. Manages a local SQLite cache database to ensure persistent tracking of system metrics and scheduled entries.
*   **`public/index.html`**: The real-time visual system dashboard powered by Alpine.js, displaying engine states and a flowing binary data stream.

---

## Quick Start

### 1. Install Dependencies
Ensure you have your environment ready with FastAPI, Uvicorn, and Pydantic:
```bash
pip install fastapi uvicorn pydantic
```
### 2. Run the Engine
Fire up the local pipeline server:

```Bash
python main.py
The application will automatically spin up at http://127.0.0.1:8000.
```

### 3. Run Automated Diagnostics
To verify processing logic and database integrity, execute the included local test scripts:

```Bash
# Audit the parser routing rules
python test.parser.py

# Simulate the full end-to-end data pipeline
python test.pipeline.py
```

### Command Protocols
The parsing engine actively listens for specific syntax routes:

Financial Tracking: spend: [amount] [category] or income: [amount] [category]

Calendar Tracking: cal: [YYYY-MM-DD] [event title]