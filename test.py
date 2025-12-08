from recommender.core import group_recommend,load_dataset

places = load_dataset("data/dataset.json")

group = [
    ["mountains", "nature"],
    ["adventure"],
]
results = group_recommend(group, places, top_n=10)

print("\n=== TOP RECOMMENDATIONS ===\n")
for r in results:
    print(f"{r['place']} ({r['state']})  --> score: {r['score']}")


