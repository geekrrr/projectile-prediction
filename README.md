# Ballistic Trajectory Prediction (React + FastAPI)

A compact full-stack project that simulates ballistic trajectories using a physics model, augments predictions with an ML model (Random Forest or other regressors), and provides a React frontend UI for visualization and media preview.

Features
- Physics-based trajectory simulation endpoint (`/predict`).
- ML model for fast impact prediction with retraining endpoint (`/retrain`).
- Static media upload and serve at `/ballistic/*`.
- Small React + Vite frontend that visualizes trajectories and lets you download or upload preview media.

Repository layout
- `backend/` — FastAPI application, model training and storage, static media folder.
	- `app/` — FastAPI app and modules (`main.py`, `model_store.py`, `sim.py`).
	- `models/` — Saved ML artifacts (e.g., `rf_model.joblib`).
- `frontend/` — Vite + React single-page app (source in `frontend/src`).
- `static/` & `frontend/public/ballistic/` — media locations for previews.

Prerequisites
- Python 3.11+ (recommended)
- Node.js 18+ and npm 9+ (for the frontend)
- Git (for version control)

Backend - install & run
1. Create and activate a Python virtual environment:

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# mac/linux
source venv/bin/activate
```

2. Install dependencies and run the API:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://127.0.0.1:8000 and includes automatic docs at http://127.0.0.1:8000/docs

Frontend - install & run
```bash
cd ../frontend
npm install
npm run dev
```
Vite will print a local URL (usually `http://127.0.0.1:5173`) where the React app runs. The frontend is configured to communicate with the backend `predict` and `model` endpoints.

Key API endpoints
- `GET /` — API root with endpoint list
- `GET /health` — Health and model status
- `POST /predict` — Run physics simulation + ML prediction
	- Example request body:

```json
{ "v0": 300, "angle": 45, "drag": 0.01, "dt": 0.01, "release_height": 0 }
```

- `POST /retrain` — Schedule model retraining (background task)
	- Example request body: `{ "n_samples": 1200, "use_forest": true }`
- `GET /model/info` — Model metadata and metrics
- `DELETE /model` — Delete the current model from memory
- `POST /upload` — Upload one or more media files; saved under `backend/static/ballistic/` and served at `/ballistic/<filename>`

Model & training
- Models are managed by `backend/app/model_store.py`. On startup the app will try to load a model from `models/`. If none exists, the application will build a model using simulated data.
- To retrain manually: use `POST /retrain` (runs in background).

Media previews and simulation script
- The frontend can download a local simulation script (for offline runs). Generated media can be placed in `frontend/public/ballistic/` to be shown by the frontend, or uploaded via the API `/upload` to be served from the backend.

Development notes
- Run backend tests (if you add tests):

```bash
cd backend
pytest
```

- Lint and format (optional): `black`, `flake8`, `mypy` are available in `requirements.txt`.

Contributing
- Open an issue or a pull request. If adding features that change the API, update the FastAPI docstrings so the auto-generated docs stay accurate.

License
- The frontend `package.json` uses the MIT license. Add `LICENSE` file if desired.

Need help?
- If you'd like, I can:
	- Add a `LICENSE` file and a more detailed contributing guide.
	- Create GitHub Actions to run tests and lint on push.
	- Help create a `Dockerfile`/`docker-compose.yml` for easier deployment.

---
If you want, I can commit this README update for you and push the changes to GitHub — tell me whether to run the git commands now.
