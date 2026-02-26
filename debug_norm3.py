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
count = np.array(834) # arbitrary count to prevent divide by zero issues that sometimes happens in old keras

normalizer = Normalization()
normalizer.build((None, 71))
normalizer.set_weights([mean, variance, count])

raw_feat = change_shape(prefs)
keras_norm = normalizer(raw_feat).numpy()

print(f"Keras Normalized feature min/max: {np.min(keras_norm):.4f} / {np.max(keras_norm):.4f}")
print(f"Keras Normalized feature Mean/Std: {np.mean(keras_norm):.4f} / {np.std(keras_norm):.4f}")

# Check with user_tower model directly
from engine.user_tower import _get_model
model = _get_model()

pred_raw = model.predict(raw_feat, verbose=0)
print(f"Pred shape: {pred_raw.shape}, mean: {np.mean(pred_raw):.4f}, std: {np.std(pred_raw):.4f}")
