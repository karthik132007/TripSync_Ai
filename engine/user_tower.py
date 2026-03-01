import sys, os
sys.path.insert(0, os.path.abspath('..'))

import numpy as np
import tensorflow as tf
from engine.change_shape import change_shape
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Normalization

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

_dir = os.path.dirname(os.path.abspath(__file__))

# Load model once at import time (not per-request)
_model = None

def _get_model():
    global _model
    if _model is None:
        weights_path = os.path.join(_dir, "user_tower.keras")
        if os.path.exists(weights_path):
            try:
                from tensorflow.keras.models import load_model
                _model = load_model(weights_path)
                print(f"Successfully loaded model from {weights_path}")
            except Exception as e:
                print(f"Warning: Could not load model from {weights_path}: {e}")
        
        if _model is None:
            print("Falling back to manual model creation...")
            normalizer = Normalization()
            _model = Sequential([
                normalizer,
                Dense(128, activation='relu'),
                Dropout(0.2),
                Dense(64)
            ])
            _model.build((None, 72))
            try:
                norm_weights = np.load(os.path.join(_dir, "norm_weights.npz"))
                normalizer.set_weights([
                    norm_weights["mean"],
                    norm_weights["variance"],
                    norm_weights["count"]
                ])
            except Exception as e2:
                print(f"Manual normalization initialization failed: {e2}")

    return _model


def get_user_embeddings(preferences):
    """
    Encode user preferences into a 64-dimensional embedding vector
    using the user tower model.

    preferences → change_shape (71D) → padding (72D) → user_tower → 64D embedding
    """
    feature_vec = change_shape(preferences)   # shape (1, 71)
    
    # Pad with one zero to match the 72-dimensional model input
    feature_vec_72 = np.zeros((1, 72), dtype=np.float32)
    feature_vec_72[0, :71] = feature_vec[0]
    
    model = _get_model()
    embedding = model.predict(feature_vec_72, verbose=0)  # shape (1, 64)
    return embedding
