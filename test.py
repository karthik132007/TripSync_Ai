from recommender.core import group_recommend,load_dataset,travel_recommend

# from core import load_dataset, travel_recommend

# Load dataset
places = load_dataset("data/dataset.json")


print("\n================ SOLO TEST ================\n")

solo_type = "solo"
solo_interests = ["mountains", "nature", "adventure"]
solo_budget = "low"

solo_results = travel_recommend(
    user_type=solo_type,
    user_interests=solo_interests,
    user_budget=solo_budget,
    places=places,
    top_n=10
)

for r in solo_results:
    print(f"{r['place']} ({r['state']}) -> score: {r['score']}")


print("\n================ FRIENDS GROUP TEST ================\n")

group_type = "friends"
group_interests = [
    ["mountains", "nature"],      # friend 1
    ["food", "nightlife"],        # friend 2
    ["adventure", "camping"]      # friend 3
]
group_budget = "mid"

group_results = travel_recommend(
    user_type=group_type,
    user_interests=group_interests,
    user_budget=group_budget,
    places=places,
    top_n=10
)

for r in group_results:
    print(f"{r['place']} ({r['state']}) -> score: {r['score']}")
