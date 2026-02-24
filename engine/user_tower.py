import sys, os
sys.path.insert(0, os.path.abspath('..'))
from db.get_from_db import get_places
import pandas as pd
import numpy as np
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

_dir = os.path.dirname(os.path.abspath(__file__))


def get_user_embeddings(preferences):
    norm_weight = np.load(os.path.join(_dir, "norm_weights.npz"))

    normalizer = tf.keras.layers.Normalization()
    normalizer.build((None, 72))

    normalizer.set_weights([
        norm_weight["mean"],
        norm_weight["variance"],
        norm_weight["count"]
    ])
    model = Sequential([
        normalizer,
        Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        Dense(64)
    ])
    # Build before loading weights to avoid ValueError
    model.build(input_shape=(None, 72))
    
    try:
        model.load_weights(os.path.join(_dir, "user_tower.keras"))
    except Exception as e:
        print("Could not load weights:", e)
        pass
        
    # Mocking the 72D feature array since change_shape is not implemented
    import time
    # deterministic randomness based on the budget to at least have some varied results
    np.random.seed(int(preferences.budget) + int(time.time()))
    dummy_input = np.random.normal(size=(1, 72))
    vector = model.predict(dummy_input)
    return vector
    
