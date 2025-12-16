#!/usr/bin/env python3
"""Simple retrain helper for local usage.

Run from PowerShell without activating scripts: use the venv python executable.

Example:
  cd S:\\Ballistic_MPI\\backend
  .\\venv\\Scripts\\python.exe retrain_local.py --n 120

Or with system python if venv not available:
  python retrain_local.py --n 120

This script will back up existing model files, run training, and print results.
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime

def backup_models(models_dir):
    os.makedirs(models_dir, exist_ok=True)
    files = ["rf_model.joblib", "scaler.joblib", "model_metadata.json"]
    backed = []
    for f in files:
        p = os.path.join(models_dir, f)
        if os.path.exists(p):
            bak = p + ".bak." + datetime.now().strftime("%Y%m%d%H%M%S")
            shutil.copy2(p, bak)
            backed.append(bak)
    return backed

def main():
    parser = argparse.ArgumentParser(description="Retrain local ML model for Ballistic project")
    parser.add_argument("--n", type=int, default=120, help="Number of training samples (default: 120)")
    parser.add_argument("--model", choices=["random_forest","gradient_boost","linear","ridge"], default="random_forest")
    parser.add_argument("--no-save", action="store_true", help="Don't save the trained model to disk")
    args = parser.parse_args()

    # Ensure we can import app.model_store
    try:
        from app.model_store import ModelStore
    except Exception:
        print("Failed to import ModelStore. Make sure you're running from the project backend folder and dependencies are installed.")
        raise

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    print("Backing up existing models (if any) in:", models_dir)
    backed = backup_models(models_dir)
    if backed:
        print("Backed up:")
        for b in backed:
            print("  ", b)
    else:
        print("No existing model files to back up.")

    print(f"Starting training with n_samples={args.n}, model_type={args.model}")
    try:
        m = ModelStore()
        print("Current model info:", json.dumps(m.get_model_info(), indent=2))
        r2 = m.build_model(n_samples=args.n, model_type=args.model, save=not args.no_save, random_state=42)
        print(f"Training completed. Test R2: {r2:.4f}")
        print("Updated model info:", json.dumps(m.get_model_info(), indent=2))
    except Exception as e:
        print("Training failed:", e)
        raise

if __name__ == "__main__":
    main()
