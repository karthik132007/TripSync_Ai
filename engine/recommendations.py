import numpy as np
import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from tensorflow.keras.models import load_model

_dir = os.path.dirname(os.path.abspath(__file__))
place_embs = np.load(os.path.join(_dir, "item_embeddings.npy"))
model = load_model(os.path.join(_dir, "reranker_model.keras"))
df_places = pd.read_csv(os.path.join(_dir, "../data/places_processed.csv"))
MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

def get_top_10(user_embs, user_months=None):
    similarity = cosine_similarity(user_embs, place_embs)
    similarity = similarity.flatten()
    
    if user_months:
        valid_months = [m.lower()[:3] for m in user_months if m.lower()[:3] in MONTHS]
        if valid_months:
            mask = df_places[valid_months].sum(axis=1) > 0
            similarity[~mask] -= 100.0
            
    top_50_idx = np.argsort(similarity)[-50:][::-1]
    top_50_embs = place_embs[top_50_idx]
    user_repeat = np.repeat(user_embs, len(top_50_embs), axis=0)
    
    interaction = np.concatenate([
        user_repeat,
        top_50_embs,
        np.abs(user_repeat - top_50_embs),
        user_repeat * top_50_embs
    ], axis=1)
    
    scores = model.predict(interaction, verbose=0).flatten()
    top_10 = np.argsort(scores)[-12:][::-1]
    
    final_top_10 = top_50_idx[top_10]
    final_scores = scores[top_10]
    
    # Apply sigmoid-like normalization to translate raw reranker scores into pseudo-probabilities %
    confidences = 1 / (1 + np.exp(-final_scores)) * 100
    
    return final_top_10, confidences
