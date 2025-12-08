from recommender.core import group_recommend

places = [
    {"name": "Goa", "tags": ["beach", "nightlife", "food"]},
    {"name": "Manali", "tags": ["mountains", "nature", "adventure"]},
    {"name": "Jaipur", "tags": ["history", "food", "culture"]}
]

group_users = [
    ["beach", "food"],
    ["beach", "nightlife"]
]

recommendations = group_recommend(group_users, places)

for r in recommendations:
    print(r)
