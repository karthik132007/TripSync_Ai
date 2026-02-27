import numpy as np
import os
import sys

sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))

from engine.change_shape import change_shape
from test_prefs import prefs

_dir = os.path.abspath('engine')
norm_weights = np.load(os.path.join(_dir, "norm_weights_correct.npz"))

mean = norm_weights['mean']
variance = norm_weights['variance']

print(f"Mean min/max: {np.min(mean):.4f} / {np.max(mean):.4f}")
print(f"Var min/max: {np.min(variance):.4f} / {np.max(variance):.4f}")

# Check the raw input feature vector
raw_feat = change_shape(prefs)
print(f"Raw feature min/max: {np.min(raw_feat):.4f} / {np.max(raw_feat):.4f}")

# Manual normalization
norm_feat = (raw_feat - mean) / np.sqrt(variance + 1e-7)
print(f"Manually Normalized feature min/max: {np.min(norm_feat):.4f} / {np.max(norm_feat):.4f}")
print(f"Manually Normalized feature Mean/Std: {np.mean(norm_feat):.4f} / {np.std(norm_feat):.4f}")

# Indices of high values:
print("Indices with high normalized values (>10):", np.where(np.abs(norm_feat) > 10))
