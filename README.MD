# S.I.R.I.U.S. Engine

S.I.R.I.U.S. Engine is a reductionist personal assistant pipeline built in Python with FastAPI, Pydantic, SQLite, and an Alpine.js web front end. It is designed to run locally on your network, process voice or typed commands, store data persistently in SQLite, and stream activity updates in real time using WebSockets.

## Architecture

The application structure consists of:

- `main.py` — central FastAPI server and router.
- `app/core/parser.py` — natural-language intent and grammar parser.
- `app/core/storage.py` — SQLite database abstraction layer.
- `public/index.html` — user dashboard.

## Installation

Install the required dependencies:

```bash
pip install fastapi uvicorn pydantic
```

## Running the Server

Start the local pipeline server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Then access the interface at:

- Local machine: `http://localhost:8000`
- Mobile devices on the same network: `http://<your-local-network-ip>:8000`

## Testing

To verify the processing logic and database integrity, run:

```bash
python test.parser.py
python test.pipeline.py
```

## Supported Input Syntax

The engine supports order-agnostic, human natural language parsing for quick logging and querying:

| Input Type | Syntax Pattern | Example |
| :--- | :--- | :--- |
| **Financial (Spend)** | `[amount] [item]` or `[item] [amount]` | `12.50 water` or `coffee 4` |
| **Financial (Income)** | `inc: [amount] [source]` | `inc: 1500 salary` |
| **Multi-Item Batch** | `[item] [amount], [item] [amount]` | `milk 3, bread 4, eggs 5` |
| **Calendar Event** | `cal: [YYYY-MM-DD] [title]` | `cal: 2026-11-01 team sync` |
| **State Query** | `show [target]` | `show spend`, `show cal`, `show all` |

*Note: The parser automatically handles currency symbols (like `$`, `€`, `£`, `kr`) and localized number formatting natively.*
