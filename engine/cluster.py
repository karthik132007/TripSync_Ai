from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import sys, os
sys.path.insert(0, os.path.abspath('..'))
from db.get_from_db import get_places

class SimilarPlaces:
    def __init__(self):
        places = get_places()

        places = places.drop(columns=[0,1])
        scale = StandardScaler()
        scale_cols = [2, 55]
        places[scale_cols] = scale.fit_transform(places[scale_cols])
        places=places.to_numpy()
        self.similarity=cosine_similarity(places)
        del places

    def get_more(self,clicked_place):            #? clicked_place will be fetched from backend 
        """
        Returns top 10 similar destinations using cosine similarity.
        """
        if clicked_place >= len(self.similarity):
            return []
        score = self.similarity[clicked_place].copy()
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

similar_engine = SimilarPlaces()