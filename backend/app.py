import sys, os
sys.path.insert(0, os.path.abspath('..'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pref_model import Preferences
from engine.cluster import *
from db.get_from_db import *
from engine import user_tower
from engine.recommendations import get_top_10
from db.search_in_json import search_place

# Add get_images import
import sys, os
sys.path.insert(0, os.path.abspath('..'))
from get_images import get_first_image

app = FastAPI()

# Add CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since frontend runs on port 5173 or others
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/plan")
def get_user_prefrences(prefrences : Preferences):
    user_embeddings = user_tower.get_user_embeddings(prefrences)
    
    top_10_idx = get_top_10(user_embeddings)
    place_names= get_with_place_id(top_10_idx)
    places=[]
    
    for place_name in place_names:
        place_data = search_place(place_name=place_name)
        if place_data:
            # Try to fetch image URL from Unsplash using get_images.py
            # Use place state if available to improve search relevance
            state = place_data.get("state", "")
            image_url = get_first_image(place_name=place_name, state=state)
            
            # Attach image URL to place dictionary
            place_data["image_url"] = image_url
            places.append(place_data)
        
    return {
        "message": "got it broo",
        "data": places,
        "preferences": prefrences
    }

@app.get("/recommend")
def show_recomendations(places):
    pass

@app.post("/recommend")
def get_clicked_place(place_name):
    get_place_id(place_name=place_name)