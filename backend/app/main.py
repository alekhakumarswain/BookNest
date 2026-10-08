import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add parent directory to sys.path so 'app' package is found when executing main.py directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, books, shelves, lending, activity, dashboard
from app.websocket import websocket_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("booknest")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up BookNest FastAPI server...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down BookNest FastAPI server...")
    await close_mongo_connection()

app = FastAPI(
    title="BookNest API",
    description="Backend API for BookNest Reading Tracker App",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(books.router)
app.include_router(shelves.router)
app.include_router(lending.router)
app.include_router(activity.router)
app.include_router(dashboard.router)
app.include_router(websocket_router)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "app": "BookNest API",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
