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
        # Load 71-feature normalization weights
        norm_weights = np.load(os.path.join(_dir, "norm_weights_correct.npz"))
        
        # Explicitly initialize the layer with the pre-trained weights
        # because normalizer.set_weights() silently fails to build inference state in some Keras versions
        normalizer = Normalization(
            mean=norm_weights["mean"],
            variance=norm_weights["variance"]
        )
        
        _model = Sequential([
            normalizer,
            Dense(128, activation='relu'),
            Dropout(0.2),
            Dense(64)
        ])
        # Explicitly build the model for shape (None, 71)
        _model.build((None, 71))
    return _model


def get_user_embeddings(preferences):
    """
    Encode user preferences into a 64-dimensional embedding vector
    using the user tower model.

    preferences → change_shape (71D feature vector) → user_tower → 64D embedding
    """
    feature_vec = change_shape(preferences)   # shape (1, 71), actual user data
    model = _get_model()
    embedding = model.predict(feature_vec, verbose=0)  # shape (1, 64)
    return embedding
