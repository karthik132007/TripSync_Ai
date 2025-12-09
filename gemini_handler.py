"""
Gemini AI Handler for TripSync
Handles place descriptions, trip details, and travel recommendations using Google Gemini API
"""

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import google.generativeai as genai
import os
from typing import Dict, List, Optional

# Lazy model init so server can start even if key is missing; functions will error clearly when called
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
_model = None


def _ensure_model():
    """Initialize and memoize the Gemini model."""
    global _model
    if _model is not None:
        return _model

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set. Export it or add to .env before calling Gemini functions.")

    genai.configure(api_key=GEMINI_API_KEY)
    _model = genai.GenerativeModel('gemini-2.5-flash')
    return _model


def get_place_description(place_name: str) -> str:
    """
    Get a concise description of a place using Gemini
    
    Args:
        place_name: Name of the place
        
    Returns:
        A 2-3 sentence description of the place
    """
    try:
        prompt = f"""Provide a concise 2-3 sentence description of {place_name} as a tourist destination. 
        Focus on its main attractions and why travelers should visit. Keep it engaging and informative."""
        
        model = _ensure_model()
        response = model.generate_content(prompt)
        return response.text if response.text else "Description not available"
    except Exception as e:
        print(f"Error generating description for {place_name}: {e}")
        return "Description not available"


def get_place_info(place_name: str) -> Dict:
    """
    Get comprehensive information about a place including foods, activities, and tips
    
    Args:
        place_name: Name of the place
        
    Returns:
        Dictionary with description, famous_foods, cuisines, activities, and travel_tips
    """
    try:
        prompt = f"""Provide travel information about {place_name} in JSON format with the following structure:
        {{
            "description": "A 2-3 sentence description of the place",
            "famous_foods": ["food1", "food2", "food3", "food4", "food5"],
            "cuisines": ["cuisine1", "cuisine2", "cuisine3"],
            "activities": ["activity1", "activity2", "activity3", "activity4"],
            "best_time_to_visit": "Best season/months to visit",
            "travel_tips": ["tip1", "tip2", "tip3"]
        }}
        
        Make sure the response is valid JSON. Focus on authentic local foods, traditional cuisines, and unique activities."""
        
        model = _ensure_model()
        response = model.generate_content(prompt)
        
        # Parse the response
        if response.text:
            import json
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    return _create_fallback_response(place_name)
        
        return _create_fallback_response(place_name)
        
    except Exception as e:
        print(f"Error fetching place info for {place_name}: {e}")
        return _create_fallback_response(place_name)


def get_trip_itinerary(place_name: str, days: int = 3, interests: List[str] = None) -> Dict:
    """
    Generate a trip itinerary for a place based on interests
    
    Args:
        place_name: Name of the destination
        days: Number of days for the trip
        interests: List of user interests (e.g., ['adventure', 'culture', 'food'])
        
    Returns:
        Dictionary with daily itinerary and travel recommendations
    """
    try:
        interests_str = ", ".join(interests) if interests else "general tourism"
        
        prompt = f"""Create a {days}-day travel itinerary for {place_name} for someone interested in: {interests_str}
        
        Provide the response in JSON format:
        {{
            "itinerary": [
                {{"day": 1, "morning": "activity", "afternoon": "activity", "evening": "activity"}},
                ...
            ],
            "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
            "estimated_budget": "budget range",
            "transportation_tips": "tips for getting around"
        }}
        
        Make sure activities are specific and realistic for {place_name}. Return valid JSON only."""
        
        model = _ensure_model()
        response = model.generate_content(prompt)
        
        if response.text:
            import json
            import re
            
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    return {"error": "Could not parse itinerary"}
        
        return {"error": "No response from Gemini"}
        
    except Exception as e:
        print(f"Error generating itinerary for {place_name}: {e}")
        return {"error": str(e)}


def get_group_trip_suggestion(places: List[str], interests: List[str], budget: str) -> str:
    """
    Get Gemini's suggestion for the best place for a group trip
    
    Args:
        places: List of candidate destinations
        interests: List of group interests
        budget: Budget level (low/medium/high)
        
    Returns:
        Gemini's recommendation text
    """
    try:
        places_str = ", ".join(places)
        interests_str = ", ".join(interests)
        
        prompt = f"""Among these destinations: {places_str}
        
        Which is best for a group interested in: {interests_str}
        Budget level: {budget}
        
        Provide a concise recommendation (2-3 sentences) explaining why this destination is the best choice for the group."""
        
        model = _ensure_model()
        response = model.generate_content(prompt)
        return response.text if response.text else "Unable to generate recommendation"
        
    except Exception as e:
        print(f"Error generating group suggestion: {e}")
        return "Unable to generate recommendation"


def _create_fallback_response(place_name: str) -> Dict:
    """Create a fallback response structure"""
    return {
        "description": f"Discover the beauty of {place_name}, a unique destination with rich culture and attractions.",
        "famous_foods": ["Local cuisine", "Traditional dishes", "Regional specialties"],
        "cuisines": ["Local", "Traditional"],
        "activities": ["Sightseeing", "Cultural exploration", "Local experiences"],
        "best_time_to_visit": "Check weather and local events",
        "travel_tips": ["Book accommodations in advance", "Respect local customs", "Try local food"]
    }


if __name__ == "__main__":
    # Test the module
    print("Testing Gemini Handler...\n")
    
    # Test place description
    print("=" * 50)
    print("Test 1: Place Description")
    print("=" * 50)
    desc = get_place_description("Jaipur")
    print(f"Jaipur: {desc}\n")
    
    # Test place info
    print("=" * 50)
    print("Test 2: Place Information")
    print("=" * 50)
    info = get_place_info("Manali")
    import json
    print(json.dumps(info, indent=2))
    print()
    
    # Test trip itinerary
    print("=" * 50)
    print("Test 3: Trip Itinerary")
    print("=" * 50)
    itinerary = get_trip_itinerary("Goa", days=3, interests=["beach", "food", "relaxation"])
    print(json.dumps(itinerary, indent=2))
