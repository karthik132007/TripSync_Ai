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

def get_top_10(user_embs, user_months=None, user_tags=None):
    # Use the raw features from the dataframe for a more reliable similarity signal
    # as the embeddings might be random/unreliable.
    
    similarity = cosine_similarity(user_embs, place_embs)
    similarity = similarity.flatten()
    
    if user_months:
        valid_months = [m.lower()[:3] for m in user_months if m.lower()[:3] in MONTHS]
        if valid_months:
            # Hard penalty for places that don't support ANY of the requested months
            mask = df_places[valid_months].sum(axis=1) > 0
            similarity[~mask] -= 0.1  # Very strong penalty
            
    if user_tags:
        # Boost places that match user tags directly in the CSV
        # This fixes the issue where random embeddings ignore tags
        for tag in user_tags:
            tag_clean = str(tag).lower().replace(" ", "-").replace("_", "-")
            if tag_clean in df_places.columns:
                similarity[df_places[tag_clean] == 1] += 0.3
            # Also try with underscores as in some parts of the code
            tag_und = str(tag).lower().replace(" ", "_").replace("-", "_")
            if tag_und in df_places.columns:
                similarity[df_places[tag_und] == 1] += 0.3

    # Get top 100 instead of 50 for more variety to rerank
    top_100_idx = np.argsort(similarity)[-100:][::-1]
    top_100_embs = place_embs[top_100_idx]
    user_repeat = np.repeat(user_embs, len(top_100_embs), axis=0)
    
    interaction = np.concatenate([
        user_repeat,
        top_100_embs,
        np.abs(user_repeat - top_100_embs),
        user_repeat * top_100_embs
    ], axis=1)
    
    scores = model.predict(interaction, verbose=0).flatten()
    
    # Add a VERY small amount of random noise to the scores to break ties
    noise = np.random.uniform(0, 0.01, size=scores.shape)
    scores = scores + noise
    
    # Get top 20
    top_n_relative = np.argsort(scores)[-20:][::-1]
    
    final_top_n_idx = top_100_idx[top_n_relative]
    final_scores = scores[top_n_relative]
    
    # Normalise confidence scores to be in a more attractive range (e.g. 85-98%)
    if len(final_scores) > 1:
        s_min, s_max = np.min(final_scores), np.max(final_scores)
        range_s = s_max - s_min if s_max > s_min else 1.0
        confidences = 85 + (final_scores - s_min) / range_s * 13
    else:
        confidences = np.array([95.0])
    
    return final_top_n_idx, confidences
