import sys, os
sys.path.insert(0, os.path.abspath('..'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pref_model import Preferences
from engine.cluster import get_similar_engine
from db.get_from_db import *
from engine import user_tower
from engine.recommendations import get_top_10
from db.search_in_json import search_place
from fastapi import Body
import sys, os
sys.path.insert(0, os.path.abspath('..'))
from get_images import get_unique_image   # per-request dedup helper

app = FastAPI()

# Add CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/plan")
def get_user_prefrences(prefrences: Preferences):
    user_embeddings = user_tower.get_user_embeddings(prefrences)

    top_10_idx = get_top_10(user_embeddings)
    raw_place_names = get_with_place_id(top_10_idx)

    # --- Deduplicate place names while preserving recommendation order ---
    seen_names: set[str] = set()
    place_names: list[str] = []
    for p in raw_place_names:
        if p not in seen_names:
            seen_names.add(p)
            place_names.append(p)

    places = []
    # Per-request pool: every image_url handed out this response goes here
    # so that get_unique_image can avoid repeating the same photo.
    used_image_urls: set[str] = set()

    for place_name in place_names:
        place_data = search_place(place_name=place_name)
        if place_data:
            state = place_data.get("state", "")
            image_url = get_unique_image(
                place_name=place_name,
                state=state,
                used_urls=used_image_urls,
            )
            if image_url:
                used_image_urls.add(image_url)   # mark as used for next iterations
            place_data["image_url"] = image_url
            places.append(place_data)

    return {
        "message": "got it broo",
        "data": places,
        "preferences": prefrences,
    }


@app.post("/recommend/place")
def get_clicked_place(place_name:str=Body(...)):
    clicked_place = get_place_id(place_name=place_name)
    more_places = get_similar_engine().get_more(clicked_place)
    ids = [item["id"] for item in more_places]

    place_names=get_with_place_id(ids)
    result = []
    for item, name in zip(more_places, place_names):
        result.append({
            "name": name,
            "score": round(item["score"]*100,3)
        })
    return{
        "message":"similar places",
        "data":result
    }
