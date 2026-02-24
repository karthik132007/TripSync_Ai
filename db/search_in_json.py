import json
import os

def search_place(place_name, file_path=None):
    if file_path is None:
        # Resolve path relative to this file's directory
        db_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(db_dir, "..", "data", "data.json")
        
    # load json
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"data file not found at {file_path}")
        return None

    # search
    for place in data:
        if place.get("place", "").lower() == place_name.lower():
            return place   # returns full body (dict)

    return None  # if not found


if __name__ == "__main__":
    # example usage
    result = search_place("Paris")

    if result:
        print(result)
    else:
        print("Place not found")