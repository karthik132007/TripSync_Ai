import json

files = [
    "data/africa.json",
    "data/americas.json",
    "data/aus.json",
    "data/europe.json",
    "data/india_updated.json",
    "data/rest-asia.json",
    "data/sean.json",
]

big_data = []

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)  # loads list
        big_data.extend(data)  # merges list into big list

# Save final big file
with open("data/data.json", "w", encoding="utf-8") as f:
    json.dump(big_data, f, indent=2, ensure_ascii=True)

print("Combined successfully")
