import pandas as pd
import json
import os

def load_dataset(path):
    ext = os.path.splitext(path)[1]

    if ext == ".json":
        df = pd.read_json(path)
    elif ext == ".csv":
        df = pd.read_csv(path)
    else:
        raise ValueError("Unsupported format: " + ext)

    # Handle popularity
    if "popularity" in df.columns:
        df['popularity_rank'] = df['popularity'].map(popularity_map).astype('Int64')

    # Fix list/string columns
    for col in ['tags', 'season', 'best_for']:
        if col in df.columns:
            df[col] = df[col].apply(
                lambda x: [str(i).lower() for i in x] if isinstance(x, list)
                else str(x).lower().split(',') if pd.notna(x)
                else []
            )

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


def match_interests_fair(user_interests, place_tags):
    place_set = set(place_tags)

    # multi-user case
    if isinstance(user_interests[0], (list, tuple)):
        per_user_scores = []
        for person in user_interests:
            person_set = set(person)
            per_user_scores.append(len(person_set & place_set))

        # NEW IMPROVED:
        # Balanced score = average + bonus for satisfying multiple users
        avg_score = sum(per_user_scores) / len(per_user_scores)
        satisfied_users = sum(1 for s in per_user_scores if s > 0)

        return avg_score + (0.5 * satisfied_users)

    # single user case
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

def travel_recommend(user_type, user_interests, user_budget, places, top_n=6):
    """
    Now supports:
    user_interests = ['mountains','nature']  → solo
    user_interests = [['mountains'],['food','nightlife']] → friends group
    """

    results = []

    for p in places:

        # Interest score (group-aware)
        interest_score = match_interests_fair(user_interests, p.get("tags", [])) * 5

        # Traveller type score (solo/friends/couples/family)
        traveller_score = match_traveller_type(user_type, p.get("best_for", [])) * 2

        # Budget score
        budget_score = match_budget(user_budget, p.get("avg_cost_per_day")) * 1

        # Popularity boost
        popularity_boost = 0.5* popularity_map.get(p.get("popularity", "Offbeat"), 1)

        # Final score
        total = interest_score + traveller_score + budget_score + popularity_boost

        results.append({
            "place": p.get("place"),
            "state": p.get("state"),
            "score": total,
            "tags": p.get("tags", []),
            "avg_cost_per_day": p.get("avg_cost_per_day"),
            "trip_duration": p.get("trip_duration"),
            "best_for": p.get("best_for", []),
            "season": p.get("season", []),
            "climate": p.get("climate"),
            "popularity": p.get("popularity")
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]
