from app.app import app
import uvicorn
import os

if __name__ == "__main__":
    reload_enabled = os.getenv("BACKEND_RELOAD", "0") == "1"
    uvicorn.run("app.app:app", host="0.0.0.0", port=8000, reload=reload_enabled)
