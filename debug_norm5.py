import numpy as np
import os
import sys
import tensorflow as tf

sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))

from engine.change_shape import change_shape
from test_prefs import prefs
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Normalization, Dense, Dropout

_dir = os.path.abspath('engine')
norm_weights = np.load(os.path.join(_dir, "norm_weights_correct.npz"))

mean = norm_weights['mean']
variance = norm_weights['variance']
count = norm_weights['count']

raw_feat = change_shape(prefs)

# Looking at normalized feature 0 (budget), 1 (duration), 53 (log total cost)
normalizer = Normalization(mean=mean, variance=variance)
keras_norm = normalizer(raw_feat).numpy()

print(f"Norm Budget (0): {keras_norm[0,0]:.4f}")
print(f"Norm Duration (1): {keras_norm[0,1]:.4f}")
print(f"Norm Total Cost Log (53): {keras_norm[0,53]:.4f}")
print(f"Norm Tag 'beach' (7): {keras_norm[0,7]:.4f}")
print(f"Norm Tag 'adventure' (6): {keras_norm[0,6]:.4f}")

# Check weights magnitude of first dense layer connected to these inputs
from engine.user_tower import _get_model
model = _get_model()

# Create a fixed model
fixed_model = Sequential([
    normalizer,
    model.layers[1],
    model.layers[2],
    model.layers[3]
])
w1 = fixed_model.layers[1].get_weights()[0] # shape (71, 128)
print(f"L1 Weight absolute sum for Budget (0): {np.sum(np.abs(w1[0])):.4f}")
print(f"L1 Weight absolute sum for Duration (1): {np.sum(np.abs(w1[1])):.4f}")
print(f"L1 Weight absolute sum for Total Cost Log (53): {np.sum(np.abs(w1[53])):.4f}")
print(f"L1 Weight absolute sum for Tag 'beach' (7): {np.sum(np.abs(w1[7])):.4f}")
print(f"L1 Weight absolute sum for Tag 'adventure' (6): {np.sum(np.abs(w1[6])):.4f}")
