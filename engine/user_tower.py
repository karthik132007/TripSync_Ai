import sys, os
sys.path.insert(0, os.path.abspath('..'))

import numpy as np
import tensorflow as tf
from engine.change_shape import change_shape

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

_dir = os.path.dirname(os.path.abspath(__file__))

# Load model once at import time (not per-request)
_model = None

def _get_model():
    global _model
    if _model is None:
        _model = tf.keras.models.load_model(os.path.join(_dir, "user_tower.keras"))
    return _model


def get_user_embeddings(preferences):
    """
    Encode user preferences into a 64-dimensional embedding vector
    using the trained user tower model.

    preferences → change_shape (72D feature vector) → user_tower.keras → 64D embedding
    """
    feature_vec = change_shape(preferences)   # shape (1, 72), actual user data
    model = _get_model()
    embedding = model.predict(feature_vec, verbose=0)  # shape (1, 64)
    return embedding
