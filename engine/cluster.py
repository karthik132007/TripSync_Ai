from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import sys, os
sys.path.insert(0, os.path.abspath('..'))
from db.get_from_db import get_places

class SimilarPlaces:
    def __init__(self):
        places = get_places()
        # store original DB ids
        self.id_list = places[0].tolist()  # assuming column 0 is id
        self.id_to_index = {db_id: i for i, db_id in enumerate(self.id_list)}

        places = places.drop(columns=[0, 1])

        remaining_cols = places.columns.tolist()
        scale = StandardScaler()
        scale_cols = [remaining_cols[0], remaining_cols[-1]]
        places[scale_cols] = scale.fit_transform(places[scale_cols])

        places = places.to_numpy()
        self.similarity = cosine_similarity(places)

    def get_more(self,clicked_place):            #? clicked_place will be fetched from backend 
        """
        Returns top 10 similar destinations using cosine similarity.
        """
        if clicked_place not in self.id_to_index:
            return []
        score = self.similarity[clicked_place].copy()
        score[clicked_place] =-1

        top10= np.argsort(score)[-10:][::-1]
        top10_scores=score[top10]

        more_like_these=[]
        for index,sim_score in zip(top10,top10_scores):
            db_id = self.id_list[index]
            more_like_these.append({
                "id":int(db_id),
                "score":float(sim_score)
            })
        return more_like_these

_similar_engine = None

def get_similar_engine():
    """Lazily initialize SimilarPlaces to avoid DB query at import time."""
    global _similar_engine
    if _similar_engine is None:
        _similar_engine = SimilarPlaces()
    return _similar_engine