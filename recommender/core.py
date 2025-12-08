import pandas as pd
import json

def load_dataset(path="data/indian_travel_destinations_enhanced.csv"):
    """Loads the CSV dataset and converts to list of dicts."""
    df = pd.read_csv(path)
    df['popularity_rank'] = df['popularity'].map(popularity_map).astype('Int64')

    # Split columns
    for col in ['tags', 'season', 'best_for']:
        df[col] = df[col].str.lower().str.split(',')

    return df.to_dict('records')

popularity_map = {
    "Offbeat": 1,
    "Medium": 2,
    "High": 3
}

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


def match_interests(user_interests, place_tags):
    """
    Supports:
    - single person → ['mountains','nature']
    - group → [['mountains','nature'], ['food','nightlife']]
    """

    place_set = set(place_tags)

    # Case 1: GROUP INPUT (list of lists)
    if user_interests and isinstance(user_interests[0], (list, tuple)):
        scores = []
        for person in user_interests:
            person_set = set(person)
            scores.append(len(person_set & place_set))
        # Return SUM so places satisfying all users rank highest
        return sum(scores)

    # Case 2: SINGLE USER (list)
    return len(set(user_interests) & place_set)



def match_traveller_type(user_type, best_for_list):
    """Return 1 if traveller type is supported, else 0."""
    return 1 if user_type.lower() in [b.lower() for b in best_for_list] else 0


def match_budget(user_budget, place_cost):
    """
    user_budget → low / mid / high
    place_cost → avg_cost_per_day (number)
    """
    if place_cost is None:
        return 0

    if user_budget == "low" and place_cost <= 1500:
        return 1
    if user_budget == "mid" and 1500 < place_cost <= 4000:
        return 1
    if user_budget == "high" and place_cost > 4000:
        return 1

    return 0


# ---------------------- FINAL COMBINED RECOMMENDER ----------------------

def travel_recommend(user_type, user_interests, user_budget, places, top_n=10):
    """
    Now supports:
    user_interests = ['mountains','nature']  → solo
    user_interests = [['mountains'],['food','nightlife']] → friends group
    """

    results = []

    for p in places:

        # Interest score (group-aware)
        interest_score = match_interests(user_interests, p.get("tags", [])) * 3

        # Traveller type score (solo/friends/couples/family)
        traveller_score = match_traveller_type(user_type, p.get("best_for", [])) * 2

        # Budget score
        budget_score = match_budget(user_budget, p.get("avg_cost_per_day")) * 1

        # Popularity boost
        popularity_boost = popularity_map.get(p.get("popularity", "Offbeat"), 1)

        # Final score
        total = interest_score + traveller_score + budget_score + popularity_boost

        results.append({
            "place": p["place"],
            "state": p["state"],
            "score": total
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]
