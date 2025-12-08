import json



def load_dataset(path="data/dataset.json"):
    """Loads dataset.json which contains a list of place dictionaries."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)   # MUST be a JSON array

popularity_map = {
    "Offbeat": 1,
    "Medium": 2,
    "High": 3
}


# ---------------------- GROUP RECOMMENDER ----------------------

def group_recommend(group_users, places, top_n=10):
    """
    group_users: list of lists e.g. [["beach","food"], ["mountains"]]
    places: list of dicts with "place" and "tags" fields
    returns: top_n places sorted by score
    """
    user_sets = [set(u) for u in group_users]

    results = []
    for place in places:
        place_tags = set(place.get("tags", []))

        # tag match score
        tag_score = sum(len(u & place_tags) for u in user_sets)

        # popularity boost
        pop_score = popularity_map.get(place.get("popularity", "Offbeat"), 1)

        final_score = tag_score + pop_score

        results.append({
            "place": place["place"],
            "state": place["state"],
            "score": final_score
        })

    # sort by score DESC
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]

