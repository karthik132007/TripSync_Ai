from engine import user_tower
from engine.recommendations import get_top_10
from db.get_from_db import get_with_place_id
from db.search_in_json import search_place
from pref_model import Preferences

pref = Preferences(month=["may", "june"], budget=50000, duration=5, best_for="friends", weather=["cool"], tags=["mountains"], popular="moderate")
user_embeddings = user_tower.get_user_embeddings(pref)
top_idx = get_top_10(user_embeddings)
print("top_idx len:", len(top_idx))
place_names = get_with_place_id(top_idx)
print("place_names len:", len(place_names))
print("place_names:", place_names)
places = []
for p in place_names:
    data = search_place(place_name=p)
    if data:
        places.append(data)
    else:
        print("Missing in JSON:", p)
print("Final mapped:", len(places))
