import numpy as np
import os
import sys

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

normalizer = Normalization()
normalizer.build((None, 71))
normalizer.set_weights([mean, variance, count])

raw_feat = change_shape(prefs)
keras_norm = normalizer(raw_feat).numpy()

print(f"Keras Normalized feature min/max: {np.min(keras_norm):.4f} / {np.max(keras_norm):.4f}")
print(f"Keras Normalized feature Mean/Std: {np.mean(keras_norm):.4f} / {np.std(keras_norm):.4f}")

print("Indices with high keras normalized values (>10):", np.where(np.abs(keras_norm) > 10))
print(f"Value at index 26: {keras_norm[0,26]}")
print(f"Mean/Var at index 26: {mean[26]} / {variance[26]}")

# Look at what index 26 is
from engine.change_shape import TAG_INDEX
inv_tag = {v: k for k, v in TAG_INDEX.items()}
print("Index 26 is:", inv_tag.get(26))
