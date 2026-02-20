import sklearn 
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import sys, os
sys.path.insert(0, os.path.abspath('..'))
from db.get_from_db import get_places

places = get_places()

places = places.drop(columns=[0,1])
scale = StandardScaler()
places[2]=scale.fit_transform(places[[2]])
places[55]=scale.fit_transform(places[[55]])
places=places.to_numpy()
similarity=cosine_similarity(places)

def get_more(clicked_place):            #? clicked_place will be fetched from backend 
    """
    Returns top 10 similar destinations using cosine similarity.
    """
    if clicked_place >= len(similarity):
        return []
    score = similarity[clicked_place].copy()
    score[clicked_place] =-1

    top10= np.argsort(score)[-10:][::-1]
    top10_scores=score[top10]

    more_like_these=[]
    for index,sim_score in zip(top10,top10_scores):
        more_like_these.append({
            "index":int(index),
            "score":float(sim_score)
        })
    return more_like_these
    