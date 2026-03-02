import json
import os

def recommend_hotel(place_id, user_preferences, top_n=5):
    # Determine the directory where this script is located
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "data", "hotels_processed.json")
    
    with open(json_path, "r") as f:
        hotels = json.load(f)

    # Convert Pydantic object to dict if needed
    if hasattr(user_preferences, "amenities"):
         # For Pydantic v1: .dict(), v2: .model_dump()
         path_fn = getattr(user_preferences, "model_dump", None) or getattr(user_preferences, "dict")
         prefs = path_fn()
    elif isinstance(user_preferences, dict):
         prefs = user_preferences
    else:
         prefs = {}

    
    # 1. Filter by place_id
    # Note: Ensure type match. JSON might have stored place_id as int or str.
    candidates = [
        h for h in hotels 
        if str(h.get("place_id")) == str(place_id)
    ]

    scored = []
    
    # Extract user constraints with safe defaults
    requested_amenities = set(prefs.get("amenities", []))
    max_price = float(prefs.get("price_per_night") or 500000)
    min_rating = float(prefs.get("min_rating") or 0)
    max_distance = float(prefs.get("distance_from_downtown") or 20)
    
    for h in candidates:
        # Check Hard Constraints
        
        # Price (handle None/null)
        price = h.get("price_per_nigh") or h.get("price_per_night")
        if price is None:
             price = 999999 # Treat missing price as expensive, or skip
        
        if price > max_price:
            continue
            
        # Rating (handle None/null)
        rating = h.get("rating")
        if rating is None: 
            rating = 0
            
        if rating < min_rating:
            continue
            
        # Distance (handle None/null)
        # If distance is missing (None), we assume it's okay/nearby to avoid filtering valid hotels with missing data
        dist = h.get("distance_from_downtown_km")
        if dist is None:
            dist = 0 # Treat as 0 distance if unknown so it passes filter and gets good score
        
        if dist > max_distance:
            continue
            
        # Calculate Scores (0.0 to 1.0) for soft ranking
        
        # Amenity Match Score
        h_amenities = set(h.get("aminities") or h.get("amenities") or [])
        if requested_amenities:
            amenity_score = len(requested_amenities & h_amenities) / len(requested_amenities)
        else:
            amenity_score = 0.5 
            
        # Price Score (cheaper is better)
        # Avoid division by zero
        safe_max_price = max_price if max_price > 0 else 1
        price_score = 1.0 - (price / safe_max_price)
        if price_score < 0: price_score = 0
        
        # Rating Score (higher is better)
        rating_score = rating / 5.0
        
        # Distance Score (closer is better)
        safe_max_dist = max_distance if max_distance > 0 else 1
        dist_score = 1.0 - (dist / safe_max_dist)
        if dist_score < 0: dist_score = 0
        
        # Weighted Total
        final_score = (
            0.4 * amenity_score +
            0.3 * price_score + 
            0.2 * rating_score + 
            0.1 * dist_score
        )
        
        h["score"] = final_score
        scored.append(h)
        
    # Sort descending
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    return scored[:top_n]
