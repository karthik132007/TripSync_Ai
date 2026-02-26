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

# Instead of relying on set_weights building state improperly, let's initialize it with mean/var explicitly.
normalizer = Normalization(mean=mean, variance=variance)

keras_norm = normalizer(raw_feat).numpy()

print(f"Keras Normalized feature min/max: {np.min(keras_norm):.4f} / {np.max(keras_norm):.4f}")
print(f"Keras Normalized feature Mean/Std: {np.mean(keras_norm):.4f} / {np.std(keras_norm):.4f}")

# Check with user_tower
from engine.user_tower import _get_model
model = _get_model()

# Create a fixed model
fixed_model = Sequential([
    normalizer,
    model.layers[1],
    model.layers[2],
    model.layers[3]
])
pred_fixed = fixed_model.predict(raw_feat, verbose=0)
print(f"Fixed pred shape: {pred_fixed.shape}, mean: {np.mean(pred_fixed):.4f}, std: {np.std(pred_fixed):.4f}")

# Test top 10 with fixed pred
from sklearn.metrics.pairwise import cosine_similarity
from db.get_from_db import get_with_place_id
from db.search_in_json import search_place

item_embs = np.load(os.path.join(_dir, "item_embeddings.npy"))
similarity = cosine_similarity(pred_fixed, item_embs).flatten()

top_10_raw_idx = np.argsort(similarity)[-10:][::-1]

print("\n--- Top 10 by FIXED RAW COSINE SIMILARITY ---")
names_raw = get_with_place_id(top_10_raw_idx.tolist())
for name, sim in zip(names_raw, np.sort(similarity)[-10:][::-1]):
    data = search_place(name)
    print(f"{name} (sim: {sim:.3f}) -> {data.get('tags', [])}")
