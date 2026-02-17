import json

# Load original data
with open("data/data.json", "r") as f:
    data = json.load(f)

# Extract only place and country
places = []

for item in data:
    place_entry = {
        "place": item.get("place"),
        "country": item.get("country")
    }
    places.append(place_entry)

# Save new file
with open("places.json", "w") as f:
    json.dump(places, f, indent=4)

print("places.json created successfully.")
