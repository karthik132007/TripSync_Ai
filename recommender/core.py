import pandas as pd
import numpy as np
# import sklearn
# from sklearn.preprocessing import OneHotEncoder

df=pd.read_csv('/home/electron/Documents/GitHub/TripSync_Ai/data/indian_travel_destinations_enhanced.csv')
popularity_map = {'Offbeat': 1, 'Medium': 2, 'High': 3}
df['popularity_rank'] = df['popularity'].map(popularity_map).astype('Int64')

def split_column(col):
    return col.str.lower().str.split(",")

df["tags"] = split_column(df["tags"])
df["season"] = split_column(df["season"])
df["best_for"] = split_column(df["best_for"])


def check_score(user_intrest,place_tags):
    score=0
    for i in user_intrest:
        if i in place_tags:
            score+=1
    return score


def group_recommend(group_users,places):
    results=[]

    for place in places:
        total_score=0
        for user in group_users:
            total_score+=check_score(user,place["tags"])

            results.append({
            "place": place["name"],
            "score": total_score
        })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:3]
