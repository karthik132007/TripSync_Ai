"""
Restructure hotels.json into a flat list with hotel_id and place_id.

Input:
  - hotels.json           : { "Place, Country": [ {hotel}, ... ], ... }
  - places_processed.csv  : id (place_id 0-1667), place (lowercase name)

Output:
  - hotels_processed.json : flat list of hotel dicts with hotel_id & place_id

All 1621 hotel place keys map to CSV places via exact match after
stripping the country suffix — no fuzzy/substring matching needed.
"""

import json
import csv
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent

# ── Load data ────────────────────────────────────────────────────────────────

with open(DATA_DIR / "hotels.json", "r") as f:
    hotels_raw: dict[str, list[dict]] = json.load(f)

# Build place_name -> place_id mapping from places_processed.csv
place_name_to_id: dict[str, int] = {}
with open(DATA_DIR / "places_processed.csv", "r") as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    for row in reader:
        place_id = int(row[0])
        place_name = row[1].strip().lower()
        place_name_to_id[place_name] = place_id

# ── Matching logic ───────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    """Lowercase, strip country suffix after last comma, collapse whitespace."""
    name = name.lower().strip()
    if "," in name:
        name = name.rsplit(",", 1)[0].strip()
    name = re.sub(r"\s+", " ", name)
    return name.strip()


def find_place_id(hotel_key: str) -> int | None:
    """Exact match only — normalize hotel key and look up in CSV."""
    norm = normalize(hotel_key)
    return place_name_to_id.get(norm)

# ── Build flat hotel list ────────────────────────────────────────────────────

hotels_processed: list[dict] = []
hotel_id_counter = 0
matched_places = 0
unmatched_places: list[str] = []

for place_key, hotel_list in hotels_raw.items():
    place_id = find_place_id(place_key)

    if place_id is not None:
        matched_places += 1
    else:
        unmatched_places.append(place_key)

    for hotel in hotel_list:
        record = {
            "hotel_id": hotel_id_counter,
            "place_id": place_id,              # None if no match found
            "place_name": place_key,           # original key for reference
            "hotel_name": hotel.get("hotel_name"),
            "price_per_night": hotel.get("price_per_night"),
            "rating": hotel.get("rating"),
            "stars": hotel.get("stars"),
            "hotel_type": hotel.get("hotel_type"),
            "distance_from_downtown_km": hotel.get("distance_from_downtown_km"),
            "amenities": hotel.get("amenities", []),
            "hotel_link": hotel.get("hotel_link"),
        }
        hotels_processed.append(record)
        hotel_id_counter += 1

# ── Save output ──────────────────────────────────────────────────────────────

output_path = DATA_DIR / "hotels_processed.json"
with open(output_path, "w") as f:
    json.dump(hotels_processed, f, indent=2, ensure_ascii=False)

# ── Summary ──────────────────────────────────────────────────────────────────

print(f"Total hotels written : {len(hotels_processed)}")
print(f"Places matched       : {matched_places} / {len(hotels_raw)}")
print(f"Places unmatched     : {len(unmatched_places)}")
if unmatched_places:
    print("\nUnmatched place keys (place_id set to null):")
    for p in unmatched_places[:30]:
        print(f"  - {p}")
    if len(unmatched_places) > 30:
        print(f"  ... and {len(unmatched_places) - 30} more")

print(f"\nOutput saved to: {output_path}")
