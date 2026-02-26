import numpy as np
import os
import sys
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))

from engine.change_shape import change_shape
from engine.user_tower import get_user_embeddings

# Test user features
from test_prefs import prefs

# 1. Inspect user embedding
user_emb = get_user_embeddings(prefs)
print(f"User Embedding Mean: {np.mean(user_emb):.4f}, Std: {np.std(user_emb):.4f}")

# 2. Inspect item embeddings
_dir = os.path.abspath('engine')
item_embs = np.load(os.path.join(_dir, "item_embeddings.npy"))
print(f"Item Embeddings Shape: {item_embs.shape}")
print(f"Item Embeddings Mean: {np.mean(item_embs):.4f}, Std: {np.std(item_embs):.4f}")

# 3. Check raw cosine similarity before reranker
similarity = cosine_similarity(user_emb, item_embs).flatten()
print(f"Top 10 Raw Cosine Similarities: {np.sort(similarity)[-10:][::-1]}")
top_10_raw_idx = np.argsort(similarity)[-10:][::-1]

from db.get_from_db import get_with_place_id
from db.search_in_json import search_place

print("\n--- Top 10 by RAW COSINE SIMILARITY ---")
names_raw = get_with_place_id(top_10_raw_idx.tolist())
for name, sim in zip(names_raw, np.sort(similarity)[-10:][::-1]):
    data = search_place(name)
    print(f"{name} (sim: {sim:.3f}) -> {data.get('tags', [])}")

# 4. Check normalization weights
norm_weights = np.load(os.path.join(_dir, "norm_weights_correct.npz"))
print(f"\nNorm weights shape: mean {norm_weights['mean'].shape}, var {norm_weights['variance'].shape}")
