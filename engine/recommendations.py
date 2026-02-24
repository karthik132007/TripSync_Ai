import numpy as np
import os
from sklearn.metrics.pairwise import cosine_similarity
from tensorflow.keras.models import load_model
_dir = os.path.dirname(os.path.abspath(__file__))
place_embs = np.load(os.path.join(_dir, "item_embeddings.npy"))
model = load_model(os.path.join(_dir, "reranker_model.keras"))
def get_top_10(user_embs):
    similarity=cosine_similarity(user_embs,place_embs)
    similarity = similarity.flatten()
    top_50_idx = np.argsort(similarity)[-50:][::-1]
    top_50_embs = place_embs[top_50_idx]
    user_repeat = np.repeat(user_embs, len(top_50_embs), axis=0)
    
    interaction = np.concatenate([
        user_repeat,
        top_50_embs,
        np.abs(user_repeat - top_50_embs),
        user_repeat * top_50_embs
        ], axis=1)
    scores = model.predict(interaction).flatten()
    top_10 = np.argsort(scores)[-12:][::-1]
    final_top_10 = top_50_idx[top_10]
    return final_top_10
