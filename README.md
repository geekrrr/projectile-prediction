# Ballistic React + FastAPI Project

## Quick run (backend)
cd backend
python -m venv venv
# activate venv:
# Windows: venv\Scripts\activate
# mac/linux: source venv/bin/activate
pip install -r requirements.txt

# run backend
uvicorn app.main:app --reload --port 8000

## Quick run (frontend)
cd ../frontend
npm install
npm run dev
# open the Vite URL (usually http://127.0.0.1:5173)

## Notes
- Backend default listens on 127.0.0.1:8000
- Frontend talks to backend /predict endpoint for simulation
- Retrain endpoint: POST /retrain with JSON { "n_samples":1200, "use_forest": true }

## Ballistic Simulation (Python script)

The project includes a Python ballistic simulation script (downloadable from the frontend Ballistic view).

Local run (recommended):

1. Download the script from the frontend: open the app, click the "Ballistic" button in the header, then "Download Simulation Script".
2. Create a virtual environment and install dependencies:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
pip install numpy scipy matplotlib
```

3. Run the script:

```bash
python ballistic_sim.py
```

4. The script will emit images or video frames. To preview them in the frontend copy the generated outputs into the frontend public folder:

- `frontend/public/ballistic/trajectory.mp4` (video preview)
- `frontend/public/ballistic/preview.jpg` or `preview.png` (image preview)

After copying files, refresh the Ballistic view in the frontend to see the preview.

Server-side integration (optional):

- You can run the Python simulation on the server (backend) and save outputs into `backend/static/ballistic/` or serve them from an endpoint. Then either copy them to `frontend/public/ballistic/` or set up the frontend to fetch the media URL.
- To expose a run endpoint, add a POST route that runs the script (careful: running arbitrary CPU-bound scripts from web requests has security and resource implications). Use a task queue (Celery/RQ) for long runs and return a URL when finished.

If you'd like, I can add an uploader in the frontend to let you upload generated previews directly from your machine, or implement a backend endpoint to run the script and stream results.
