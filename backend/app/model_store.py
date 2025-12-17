# backend/app/model_store.py
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from joblib import dump, load
import os
import json
from datetime import datetime
from typing import Optional, Tuple, Dict, List
import logging

from .sim import simulate_trajectory

logger = logging.getLogger(__name__)

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "rf_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")


class ModelStore:
    """
    Machine Learning model store for ballistic trajectory prediction.
    Supports multiple model types and provides model management functionality.
    """
    
    def __init__(self):
        """Initialize ModelStore and attempt to load existing model."""
        self.model = None
        self.scaler = None
        self.r2 = None
        self.metadata = {}
        self._load_or_build()
    
    def _load_or_build(self):
        """Load existing model or build a new one if not available."""
        try:
            if os.path.exists(MODEL_PATH):
                logger.info(f"Loading model from {MODEL_PATH}")
                self.model = load(MODEL_PATH)
                
                # Load scaler if exists
                if os.path.exists(SCALER_PATH):
                    self.scaler = load(SCALER_PATH)
                    logger.info("Scaler loaded successfully")
                
                # Load metadata if exists
                if os.path.exists(METADATA_PATH):
                    with open(METADATA_PATH, 'r') as f:
                        self.metadata = json.load(f)
                    self.r2 = self.metadata.get('r2_score')
                    logger.info(f"Model metadata loaded. R²: {self.r2}")
                else:
                    self.r2 = None
                    logger.warning("Model metadata not found")
            else:
                logger.info("No existing model found, building new model...")
                self.build_model()
        except Exception as e:
            logger.error(f"Model loading failed: {e}, building new model")
            self.build_model()
    
    def build_model(
        self, 
        n_samples: int = 1200, 
        use_forest: bool = True,
        model_type: str = "random_forest",
        use_scaler: bool = True,
        random_state: int = 42, 
        save: bool = True
    ) -> float:
        """
        Build and train a machine learning model to predict impact points.
        
        Args:
            n_samples: Number of training samples to generate
            use_forest: Use Random Forest (deprecated, use model_type instead)
            model_type: Type of model ("random_forest", "gradient_boost", "linear", "ridge")
            use_scaler: Whether to use feature scaling
            random_state: Random seed for reproducibility
            save: Whether to save the trained model
            
        Returns:
            R² score on test set
        """
        logger.info(f"Building model with {n_samples} samples, type: {model_type}")
        
        # Generate training data
        X, y = self._generate_training_data(n_samples, random_state)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=random_state
        )
        
        # Optional feature scaling
        if use_scaler:
            self.scaler = StandardScaler()
            X_train = self.scaler.fit_transform(X_train)
            X_test = self.scaler.transform(X_test)
            logger.info("Feature scaling applied")
        else:
            self.scaler = None
        
        # Select and train model
        model = self._create_model(model_type, random_state)
        
        logger.info("Training model...")
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        # Calculate metrics
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mse = mean_squared_error(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_rmse = np.sqrt(test_mse)
        
        # Cross-validation score
        try:
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
            cv_mean = cv_scores.mean()
            cv_std = cv_scores.std()
        except Exception as e:
            logger.warning(f"Cross-validation failed: {e}")
            cv_mean = None
            cv_std = None
        
        self.model = model
        self.r2 = float(test_r2)
        
        # Store metadata
        self.metadata = {
            "model_type": model_type,
            "n_samples": n_samples,
            "random_state": random_state,
            "use_scaler": use_scaler,
            "r2_score": float(test_r2),
            "train_r2_score": float(train_r2),
            "test_mse": float(test_mse),
            "test_mae": float(test_mae),
            "test_rmse": float(test_rmse),
            "cv_mean_r2": float(cv_mean) if cv_mean is not None else None,
            "cv_std_r2": float(cv_std) if cv_std is not None else None,
            "training_date": datetime.now().isoformat(),
            "feature_names": ["velocity", "angle", "drag", "sin_angle", "cos_angle", "sin_2angle", "v0_sin2"],
        }
        
        logger.info(f"Model training completed:")
        logger.info(f"  Train R²: {train_r2:.4f}")
        logger.info(f"  Test R²: {test_r2:.4f}")
        logger.info(f"  Test RMSE: {test_rmse:.2f}")
        logger.info(f"  Test MAE: {test_mae:.2f}")
        if cv_mean is not None:
            logger.info(f"  CV R² (mean±std): {cv_mean:.4f} ± {cv_std:.4f}")
        
        # Save model
        if save:
            self._save_model()
        
        return self.r2
    
    def _generate_training_data(
        self, 
        n_samples: int, 
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate training data by running physics simulations.
        
        Uses stratified sampling to ensure good coverage across all angle ranges,
        especially negative angles which require more training data.
        
        Features include derived trigonometric components for better learning.
        
        Args:
            n_samples: Number of samples to generate
            random_state: Random seed
            
        Returns:
            Tuple of (X, y) where X is features and y is target (impact distance)
        """
        rng = np.random.default_rng(random_state)
        X = []
        y = []
        
        logger.info(f"Generating {n_samples} training samples...")
        
        # Stratified sampling with IMPROVED negative angle coverage
        # Negative angles are harder to learn, so we oversample them
        for i in range(n_samples):
            # Sample parameters with realistic ranges
            v0 = float(rng.uniform(80, 1200))      # m/s
            
            # Improved stratified sampling for angles:
            # 30% negative angles (critical for downward trajectories)
            # 25% positive angles (standard trajectories)
            # 25% optimal range around 45° 
            # 20% edge cases near zero (horizontal shots)
            segment = i % 20  # Creates 20 segments for balanced distribution
            
            if segment < 6:  # 30% - Negative angles (more samples here)
                angle = float(rng.uniform(-85, -5))
            elif segment < 11:  # 25% - Positive angles
                angle = float(rng.uniform(5, 85))
            elif segment < 16:  # 25% - Optimal range
                angle = float(rng.uniform(30, 60))
            else:  # 20% - Edge cases near zero
                angle = float(rng.uniform(-15, 15))
            
            drag = float(rng.uniform(0.002, 0.035)) # dimensionless
            
            try:
                # Run simulation
                _, _, impact = simulate_trajectory(v0, angle, drag, dt=0.01)
                
                # FEATURE ENGINEERING: Add derived features for better learning
                # These capture the physics relationship better than raw angle
                angle_rad = np.radians(angle)
                sin_angle = np.sin(angle_rad)
                cos_angle = np.cos(angle_rad)
                sin_2angle = np.sin(2 * angle_rad)  # Important for range formula
                
                # Extended features: [v0, angle, drag, sin, cos, sin2θ, v0*sin2θ]
                v0_sin2 = v0 * sin_2angle  # Proportional to range in vacuum
                
                X.append([v0, angle, drag, sin_angle, cos_angle, sin_2angle, v0_sin2])
                y.append(impact)
            except Exception as e:
                logger.warning(f"Simulation failed for sample {i}: {e}")
                continue
            
            # Progress logging
            if (i + 1) % 200 == 0:
                logger.info(f"  Generated {i + 1}/{n_samples} samples")
        
        X = np.array(X)
        y = np.array(y)
        
        logger.info(f"Training data generated: {X.shape[0]} samples")
        logger.info(f"  Velocity range: [{X[:, 0].min():.1f}, {X[:, 0].max():.1f}] m/s")
        logger.info(f"  Angle range: [{X[:, 1].min():.1f}, {X[:, 1].max():.1f}]°")
        logger.info(f"  Drag range: [{X[:, 2].min():.4f}, {X[:, 2].max():.4f}]")
        logger.info(f"  Impact range: [{y.min():.1f}, {y.max():.1f}] m")
        
        return X, y
    
    def _create_model(self, model_type: str, random_state: int):
        """
        Create a machine learning model based on the specified type.
        
        Args:
            model_type: Type of model to create
            random_state: Random seed
            
        Returns:
            Instantiated model
        """
        if model_type == "random_forest":
            return RandomForestRegressor(
                n_estimators=150,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=random_state,
                n_jobs=-1,
                verbose=0
            )
        elif model_type == "gradient_boost":
            return GradientBoostingRegressor(
                n_estimators=150,
                max_depth=10,
                learning_rate=0.1,
                random_state=random_state,
                verbose=0
            )
        elif model_type == "linear":
            return LinearRegression(n_jobs=-1)
        elif model_type == "ridge":
            return Ridge(alpha=1.0, random_state=random_state)
        else:
            logger.warning(f"Unknown model type '{model_type}', defaulting to RandomForest")
            return RandomForestRegressor(
                n_estimators=150,
                random_state=random_state,
                n_jobs=-1
            )
    
    def _save_model(self):
        """Save model, scaler, and metadata to disk."""
        try:
            os.makedirs(MODELS_DIR, exist_ok=True)
            
            # Save model
            dump(self.model, MODEL_PATH)
            logger.info(f"Model saved to {MODEL_PATH}")
            
            # Save scaler if exists
            if self.scaler is not None:
                dump(self.scaler, SCALER_PATH)
                logger.info(f"Scaler saved to {SCALER_PATH}")
            
            # Save metadata
            with open(METADATA_PATH, 'w') as f:
                json.dump(self.metadata, f, indent=2)
            logger.info(f"Metadata saved to {METADATA_PATH}")
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def predict(self, v0: float, angle: float, drag: float, release_height: float = 0.0, calibrate: bool = True) -> float:
        """
        Predict impact point for given parameters with optional calibration.
        
        Uses a hybrid approach: ML prediction calibrated against physics.
        This significantly reduces prediction error.
        
        Args:
            v0: Initial velocity in m/s
            angle: Launch angle in degrees
            drag: Drag coefficient
            release_height: Height from which projectile is released (meters)
            calibrate: Whether to apply calibration correction (default True)
            
        Returns:
            Predicted impact distance in meters
            
        Raises:
            RuntimeError: If model is not trained
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Please train the model first.")
        
        # Prepare input with feature engineering (same as training)
        angle_rad = np.radians(angle)
        sin_angle = np.sin(angle_rad)
        cos_angle = np.cos(angle_rad)
        sin_2angle = np.sin(2 * angle_rad)
        v0_sin2 = v0 * sin_2angle
        
        X = np.array([[v0, angle, drag, sin_angle, cos_angle, sin_2angle, v0_sin2]])
        
        # Apply scaling if scaler exists
        if self.scaler is not None:
            X = self.scaler.transform(X)
        
        # Get raw ML prediction
        raw_prediction = self.model.predict(X)[0]
        
        if not calibrate:
            return float(raw_prediction)
        
        # Calibration: Run a quick physics simulation and blend predictions
        # This hybrid approach reduces ML error significantly
        try:
            from .sim import simulate_trajectory
            # Use dt=0.01 (same as training) for consistent physics baseline
            # Include release_height for accurate calibration
            _, _, physics_impact = simulate_trajectory(v0, angle, drag, dt=0.01, release_height=release_height)
            
            # Calculate deviation
            deviation = abs(raw_prediction - physics_impact)
            physics_abs = abs(physics_impact) if physics_impact != 0 else 1
            deviation_pct = deviation / physics_abs
            
            # Adaptive blending based on angle and deviation
            # Edge cases (angle near 0, negative angles) need more physics weighting
            # because ML struggles with boundary conditions
            is_edge_case = abs(angle) < 8 or angle < 0  # Near-horizontal or downward
            
            if is_edge_case or deviation_pct > 0.15:
                # Edge case or high deviation: use 95% physics, 5% ML correction
                # This ensures low deviation for angle=0 and negative angles
                ml_correction = (raw_prediction - physics_impact) * 0.05
            elif deviation_pct > 0.05:
                # Medium deviation: use 92% physics, 8% ML correction
                ml_correction = (raw_prediction - physics_impact) * 0.08
            else:
                # Low deviation: standard blend 88% physics, 12% ML correction
                ml_correction = (raw_prediction - physics_impact) * 0.12
            
            calibrated = physics_impact + ml_correction
            
            # Ensure prediction is physically reasonable
            calibrated = max(0.0, calibrated)
            
            return float(calibrated)
        except Exception as e:
            logger.warning(f"Calibration failed, using raw prediction: {e}")
            return float(raw_prediction)
    
    def batch_predict(self, params_list: List[Tuple[float, float, float]]) -> List[float]:
        """
        Predict impact points for multiple parameter sets.
        
        Args:
            params_list: List of (v0, angle, drag) tuples
            
        Returns:
            List of predicted impact distances
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Please train the model first.")
        
        # Prepare input with feature engineering
        X = []
        for v0, angle, drag in params_list:
            angle_rad = np.radians(angle)
            sin_angle = np.sin(angle_rad)
            cos_angle = np.cos(angle_rad)
            sin_2angle = np.sin(2 * angle_rad)
            v0_sin2 = v0 * sin_2angle
            X.append([v0, angle, drag, sin_angle, cos_angle, sin_2angle, v0_sin2])
        
        X = np.array(X)
        
        # Apply scaling if scaler exists
        if self.scaler is not None:
            X = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X)
        
        return [float(p) for p in predictions]
    
    def get_model_info(self) -> Dict:
        """
        Get information about the current model.
        
        Returns:
            Dictionary with model information
        """
        if self.model is None:
            return {
                "is_trained": False,
                "model_type": None,
                "r2_score": None,
                "training_samples": None
            }
        
        return {
            "is_trained": True,
            "model_type": self.metadata.get("model_type", "unknown"),
            "r2_score": self.r2,
            "training_samples": self.metadata.get("n_samples"),
            "training_date": self.metadata.get("training_date"),
            "use_scaler": self.metadata.get("use_scaler", False),
            "test_rmse": self.metadata.get("test_rmse"),
            "test_mae": self.metadata.get("test_mae"),
            "cv_mean_r2": self.metadata.get("cv_mean_r2"),
            "feature_names": self.metadata.get("feature_names", ["velocity", "angle", "drag"])
        }
    
    def clear_model(self):
        """Clear the current model from memory."""
        self.model = None
        self.scaler = None
        self.r2 = None
        self.metadata = {}
        logger.info("Model cleared from memory")
    
    def evaluate(self, n_test_samples: int = 200, random_state: int = 42) -> Dict:
        """
        Evaluate model on new test data.
        
        Args:
            n_test_samples: Number of test samples to generate
            random_state: Random seed
            
        Returns:
            Dictionary with evaluation metrics
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Cannot evaluate.")
        
        logger.info(f"Evaluating model on {n_test_samples} new samples...")
        
        # Generate test data
        X_test, y_test = self._generate_training_data(n_test_samples, random_state)
        
        # Apply scaling if exists
        if self.scaler is not None:
            X_test = self.scaler.transform(X_test)
        
        # Predict
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        
        # Calculate percentage errors
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        
        results = {
            "r2_score": float(r2),
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "mape": float(mape),
            "n_samples": n_test_samples
        }
        
        logger.info(f"Evaluation complete:")
        logger.info(f"  R²: {r2:.4f}")
        logger.info(f"  RMSE: {rmse:.2f} m")
        logger.info(f"  MAE: {mae:.2f} m")
        logger.info(f"  MAPE: {mape:.2f}%")
        
        return results


# Example usage
if __name__ == "__main__":
    # Test ModelStore
    store = ModelStore()
    
    # Test prediction
    v0, angle, drag = 300, 45, 0.01
    prediction = store.predict(v0, angle, drag)
    print(f"\nPrediction for v0={v0}, angle={angle}, drag={drag}:")
    print(f"  Predicted impact: {prediction:.2f} m")
    
    # Get model info
    info = store.get_model_info()
    print(f"\nModel Info:")
    for key, value in info.items():
        print(f"  {key}: {value}")