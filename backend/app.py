import sys, os
sys.path.insert(0, os.path.abspath('..'))
from ask_gpt import ask_llm
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pref_model import Preferences
from engine.cluster import get_similar_engine
from db.get_from_db import *
from engine import user_tower
from engine.recommendations import get_top_10
from db.search_in_json import search_place
from fastapi import Body
from get_images import get_unique_image   # per-request dedup helper
from pydantic import BaseModel
import json

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

    top_10_idx, confidences = get_top_10(user_embeddings, user_months=prefrences.month)
    raw_place_names = get_with_place_id(top_10_idx)

    # --- Deduplicate place names while preserving recommendation order ---
    seen_names: set[str] = set()
    unique_places_info = []

    for place_id, place_name, confidence in zip(top_10_idx, raw_place_names, confidences):
        if place_name not in seen_names:
            seen_names.add(place_name)
            unique_places_info.append((place_id, place_name, confidence))
            if len(unique_places_info) == 12:
                break

    places = []
    # Per-request pool: every image_url handed out this response goes here
    # so that get_unique_image can avoid repeating the same photo.
    used_image_urls: set[str] = set()

    for place_id, place_name, confidence in unique_places_info:
        place_data = search_place(place_name=place_name)

        if place_data:
            state = place_data.get("state", "")
            image_url = get_unique_image(
                place_name=place_name,
                state=state,
                used_urls=used_image_urls,
                tags=place_data.get("tags", []),
            )

            place_data["id"] = int(place_id)   
            place_data["image_url"] = image_url
            place_data["confidence_score"] = f"{confidence:.1f}%"

            places.append(place_data)

    return {
        "message": "got it broo",
        "data": places,
        "preferences": prefrences,
    }


@app.get("/places/{place_id}")
def view_about_place(place_id :int):
    place_name = get_with_place_id([place_id])[0]
    place_data = search_place(place_name=place_name)
    
    # get up to 3 images for the destination page
    from get_images import get_place_images
    images = get_place_images(
        place_name=place_name, 
        state=place_data.get("state", ""),
        per_page=3,
        tags=place_data.get("tags", [])
    )
    
    place_data["id"] = place_id
    # Fallback to the first image for backward compatibility
    place_data["image_url"] = images[0].get("url_regular") if images else None
    
    # Map out the regular URLs for the frontend
    place_data["images"] = [img.get("url_regular") or img.get("url_full") for img in images]

    return {
        "message": "place info",
        "data": place_data
    }

@app.get("/places/{place_id}/related")
def get_clicked_place(place_id: int):
    more_places = get_similar_engine().get_more(place_id)
    ids = [item["id"] for item in more_places]

    place_names=get_with_place_id(ids)
    result = []
    used_image_urls: set[str] = set()
    
    for item, name in zip(more_places, place_names):
        place_info = search_place(place_name=name)
        state = place_info.get("state", "") if place_info else ""
        tags = place_info.get("tags", []) if place_info else []
        
        image_url = get_unique_image(
            place_name=name, 
            state=state, 
            used_urls=used_image_urls,
            tags=tags
        )
        
        if image_url:
            used_image_urls.add(image_url)

        result.append({
            "id":item["id"],
            "name": name,
            "score": round(item["score"]*100,3),
            "image_url": image_url,
            "state": state
        })
    return{
        "message":"similar places",
        "data":result
    }
class PlanRequest(BaseModel):
    duration: int
    place: str
    best_for: str
    budget: int
    tags: str

@app.post("/places/{place_id}/plan")
def generate_plan(place_id: int, request: PlanRequest):
    # Prepare preferences dict for ask_llm
    preferences = {
        "duration": request.duration,
        "place": request.place,
        "best_for": request.best_for,
        "budget": request.budget,
        "tags": request.tags
    }
    
    plan_text = ask_llm(preferences=preferences)
    
    return {
        "message": "Plan generated successfully",
        "data": plan_text
    }
