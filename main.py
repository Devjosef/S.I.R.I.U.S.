import os
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.core.parser import AssistantParser
from app.core.storage import init_db, save_financial_metric, save_calendar_event

init_db()

app = FastAPI(
    title="S.I.R.I.U.S. Engine",
    description="Reductionist Personal Assistant local pipeline.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    command: str

@app.post("/api/command")
async def process_assistant_command(payload: CommandRequest):
    try:
        parsed_obj = AssistantParser.parse_text(payload.command)
        class_name = parsed_obj.__class__.__name__

        if class_name == "FinancialMetric":
            save_financial_metric(parsed_obj)
            return {
                "status": "success",
                "route": "finances",
                "data": parsed_obj.model_dump()
            }
        
        elif class_name == "CalendarEvent":
            save_calendar_event(parsed_obj)
            return {
                "status": "success",
                "route": "calendar",
                "data": parsed_obj.model_dump()
            }
            
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_status():
    return {
        "status": "online",
        "engine": "Python/FastAPI Core",
        "storage": "SQLite Local Cache"
    }

# Explicitly handle and accept the frontend live stream connection
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

@app.get("/manifest.json")
async def get_manifest():
    manifest_path = os.path.join("public", "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path)
    return JSONResponse({
        "short_name": "SIRIUS",
        "name": "S.I.R.I.U.S. Engine",
        "start_url": "/",
        "display": "standalone"
    })

# Add explicit HEAD support for Render's automated health checks
@app.head("/")
@app.get("/")
async def serve_index():
    if os.path.exists("public/index.html"):
        return FileResponse("public/index.html")
    # If no static frontend exists, return a simple JSON response for root
    return JSONResponse({"status": "online", "message": "S.I.R.I.U.S. Engine API"})

@app.get("/{file_path:path}")
async def serve_static_assets(file_path: str):
    local_path = os.path.join("public", file_path)
    if os.path.exists(local_path) and os.path.isfile(local_path):
        return FileResponse(local_path)
    raise HTTPException(status_code=404, detail="Asset not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)