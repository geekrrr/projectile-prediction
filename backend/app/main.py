# backend/app/main.py
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, UploadFile, File
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from .sim import simulate_trajectory
from .model_store import ModelStore
import logging
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import shutil
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ballistic Trajectory Prediction API",
    description="API for ballistic missile trajectory prediction using physics simulation and ML",
    version="1.0.0"
)

# Static media directory for ballistic previews
BASE_DIR = Path(__file__).resolve().parents[1]  # backend folder
MEDIA_DIR = BASE_DIR / 'static' / 'ballistic'
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files at /ballistic
app.mount("/ballistic", StaticFiles(directory=str(MEDIA_DIR)), name="ballistic")

# CORS - allow from frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model store
MODEL_STORE = ModelStore()

# ===== Request/Response Models =====

class PredictIn(BaseModel):
    v0: float = Field(..., gt=0, description="Initial velocity in m/s", example=300)
    angle: float = Field(..., ge=-90, le=90, description="Launch angle in degrees (-90 to 90, negative for downward)", example=45)
    drag: float = Field(..., ge=0, description="Drag coefficient", example=0.01)
    dt: float = Field(0.01, gt=0, description="Time step in seconds", example=0.01)
    release_height: float = Field(0.0, ge=0, le=10000, description="Release height from ground in meters", example=0)

    class Config:
        schema_extra = {
            "example": {
                "v0": 300,
                "angle": 45,
                "drag": 0.01,
                "dt": 0.01,
                "release_height": 0
            }
        }

class TrajectoryPoint(BaseModel):
    x: float
    y: float

class PredictOut(BaseModel):
    xs: List[float]
    ys: List[float]
    impact_physics: float
    impact_ml: Optional[float]
    max_height: float
    max_range: float
    flight_time: float
    trajectory_points: int

class RetrainIn(BaseModel):
    n_samples: int = Field(1200, gt=0, le=10000, description="Number of training samples")
    use_forest: bool = Field(True, description="Use Random Forest (True) or Linear Regression (False)")

class RetrainOut(BaseModel):
    status: str
    requested_samples: int
    use_forest: bool

class ModelInfoOut(BaseModel):
    is_trained: bool
    model_type: Optional[str]
    r2_score: Optional[float]
    training_samples: Optional[int]

class HealthOut(BaseModel):
    status: str
    model_loaded: bool
    api_version: str

# ===== API Endpoints =====

@app.get("/", tags=["General"])
def root():
    """Root endpoint - API information"""
    return {
        "message": "Ballistic Trajectory Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "model_info": "/model/info",
            "retrain": "/retrain"
        }
    }

@app.get("/health", response_model=HealthOut, tags=["General"])
def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model_loaded": MODEL_STORE.model is not None,
        "api_version": "1.0.0"
    }

@app.post("/predict", response_model=PredictOut, tags=["Prediction"])
def predict(p: PredictIn):
    """
    Predict ballistic trajectory using physics simulation and ML model
    
    - **v0**: Initial velocity in m/s (must be positive)
    - **angle**: Launch angle in degrees (-90 to 90, negative for downward firing)
    - **drag**: Drag coefficient (must be non-negative)
    - **dt**: Time step for simulation in seconds (default: 0.01)
    """
    try:
        # Run physics simulation
        logger.info(f"Running simulation: v0={p.v0}, angle={p.angle}, drag={p.drag}, release_height={p.release_height}")
        xs, ys, impact = simulate_trajectory(p.v0, p.angle, p.drag, dt=p.dt, release_height=p.release_height)
        
        # Calculate additional statistics
        max_height = max(ys) if ys else 0
        max_range = xs[-1] if xs else 0
        flight_time = len(xs) * p.dt
        
        # Try ML prediction
        ml_pred = None
        try:
            if MODEL_STORE.model is not None:
                ml_pred = MODEL_STORE.predict(p.v0, p.angle, p.drag)
                logger.info(f"ML prediction: {ml_pred}")
            else:
                logger.warning("ML model not loaded, skipping ML prediction")
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            ml_pred = None

        return PredictOut(
            xs=xs,
            ys=ys,
            impact_physics=impact,
            impact_ml=ml_pred,
            max_height=max_height,
            max_range=max_range,
            flight_time=flight_time,
            trajectory_points=len(xs)
        )
    
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/model/info", response_model=ModelInfoOut, tags=["Model"])
def model_info():
    """Get information about the current ML model"""
    try:
        info = MODEL_STORE.get_model_info()
        return ModelInfoOut(**info)
    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        return ModelInfoOut(
            is_trained=False,
            model_type=None,
            r2_score=None,
            training_samples=None
        )

def _retrain_task(n_samples: int, use_forest: bool):
    """Background task for model retraining"""
    try:
        logger.info(f"Starting model retraining with {n_samples} samples, use_forest={use_forest}")
        new_r2 = MODEL_STORE.build_model(n_samples=n_samples, use_forest=use_forest, save=True)
        logger.info(f"Retrain completed successfully. New R²: {new_r2:.4f}")
    except Exception as e:
        logger.error(f"Retrain failed: {e}")

@app.post("/retrain", response_model=RetrainOut, tags=["Model"])
def retrain(payload: RetrainIn, background_tasks: BackgroundTasks):
    """
    Retrain the ML model with new parameters (runs in background)
    
    - **n_samples**: Number of training samples to generate (default: 1200)
    - **use_forest**: Use Random Forest (True) or Linear Regression (False)
    """
    try:
        # Schedule retraining in background
        background_tasks.add_task(_retrain_task, payload.n_samples, payload.use_forest)
        logger.info(f"Retraining scheduled: n_samples={payload.n_samples}, use_forest={payload.use_forest}")
        
        return RetrainOut(
            status="retraining started",
            requested_samples=payload.n_samples,
            use_forest=payload.use_forest
        )
    except Exception as e:
        logger.error(f"Failed to schedule retraining: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start retraining: {str(e)}")

@app.delete("/model", tags=["Model"])
def delete_model():
    """Delete the current ML model"""
    try:
        MODEL_STORE.clear_model()
        logger.info("Model deleted successfully")
        return {"status": "model deleted", "message": "ML model has been cleared"}
    except Exception as e:
        logger.error(f"Failed to delete model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")


@app.post("/upload", tags=["Media"])
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload one or more media files (images or video) and save under backend/static/ballistic/.

    Returns list of accessible URLs under /ballistic/filename
    """
    saved_urls = []
    try:
        for upload in files:
            filename = os.path.basename(upload.filename)
            dest_path = MEDIA_DIR / filename
            # write file
            with dest_path.open('wb') as f:
                content = await upload.read()
                f.write(content)
            saved_urls.append(f"/ballistic/{filename}")
        return {"saved": saved_urls}
    except Exception as e:
        logger.error(f"Failed to save uploaded files: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler for unexpected errors"""
    logger.error(f"Unexpected error: {exc}")
    return {
        "error": "Internal server error",
        "detail": str(exc),
        "status_code": 500
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    logger.info("Starting Ballistic Trajectory Prediction API")
    try:
        # Try to load existing model
        if MODEL_STORE.model is None:
            logger.info("No pre-trained model found. Model will be trained on first use.")
        else:
            logger.info("Pre-trained model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load pre-trained model: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Ballistic Trajectory Prediction API")