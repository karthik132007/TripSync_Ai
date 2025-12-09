"""
Arli AI Handler for TripSync
Handles place descriptions, trip details, and travel recommendations using Arli API
"""

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import requests
import os
import json
from typing import Dict, List, Optional

# Arli API Configuration
ARLI_API_KEY = os.getenv("ARLI_API_KEY", "5bb3d6c8-c657-40c7-9ff5-0a8d2646bf45")
ARLI_API_URL = "https://api.arliai.com/v1/chat/completions"
ARLI_MODEL = "Gemma-3-27B-it"

def _ensure_api_key():
    """Check if API key is set."""
    if not ARLI_API_KEY:
        raise RuntimeError("ARLI_API_KEY not set. Export it or add to .env before calling Arli functions.")
    return ARLI_API_KEY


def _call_arli_api(prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
    """
    Call Arli API with given prompt
    
    Args:
        prompt: The prompt to send to Arli
        temperature: Creativity level (0-1)
        max_tokens: Maximum response length
        
    Returns:
        Response text from Arli API
    """
    try:
        api_key = _ensure_api_key()
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        payload = json.dumps({
            "model": ARLI_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a concise travel guide. Return short, factual answers. Keep JSON tight and valid."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "repetition_penalty": 1.05,
            "temperature": temperature,
            "top_p": 0.9,
            "top_k": 40,
            "max_completion_tokens": max_tokens,
            "stream": False
        })
        
        response = requests.post(ARLI_API_URL, headers=headers, data=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            # Handle Arli response format
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
            else:
                return str(data)
        else:
            error_msg = f"Arli API error: {response.status_code} - {response.text[:200]}"
            print(error_msg)
            raise Exception(error_msg)
            
    except requests.exceptions.Timeout:
        raise Exception("Arli API request timed out")
    except Exception as e:
        print(f"Error calling Arli API: {e}")
        raise


def get_place_description(place_name: str) -> str:
    """
    Get a concise description of a place using Arli
    
    Args:
        place_name: Name of the place
        
    Returns:
        A 2-3 sentence description of the place
    """
    try:
        prompt = f"""Provide a concise 2-3 sentence description of {place_name} as a tourist destination. 
        Focus on its main attractions and why travelers should visit. Keep it engaging and informative."""
        
        response = _call_arli_api(prompt, max_tokens=500)
        return response if response else "Description not available"
        
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
        
        response = _call_arli_api(prompt, max_tokens=1500)
        
        if response:
            import re
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    return _create_fallback_response(place_name)
        
        return _create_fallback_response(place_name)
        
    except Exception as e:
        print(f"Error fetching place info for {place_name}: {e}")
        return _create_fallback_response(place_name)


def get_full_trip_plan(place_name: str, duration: int = 3, role: str = "tourist", 
                       budget: str = "medium", interests: List[str] = None) -> Dict:
    """
    Generate a comprehensive trip plan and full guide for a place
    
    Args:
        place_name: Name of the destination
        duration: Number of days for the trip
        role: User type (tourist/adventure_seeker/foodie/cultural_enthusiast/family/solo_traveler/couple)
        budget: Budget level (low/medium/high)
        interests: List of user interests
        
    Returns:
        Dictionary with complete trip plan, itinerary, budget, and detailed guide
    """
    try:
        interests_str = ", ".join(interests) if interests else "sightseeing"
        
        prompt = (
            f"Create a {duration}-day plan for {place_name} for a {role} on a {budget} budget. "
            f"Interests: {interests_str}. Return only valid JSON with these keys: "
            f"trip_title (string), role (string), budget (string), duration (string), "
            f"daily_schedule (array of objects with day, morning, afternoon, evening, cost), "
            f"budget_breakdown (object with accommodation, food, activities, transport, total_per_day, trip_total), "
            f"must_see (array of 3-5 places), food_to_try (array of 3-5 dishes), "
            f"getting_around (string), best_season (string), packing (array of 3-5 items), tips (array of 3-5 strings). "
            f"Keep all values concise."
        )

        response = _call_arli_api(prompt, temperature=0.6, max_tokens=1500)
        
        if response:
            import re
            
            json_match = re.search(r'\{[\s\S]*\}', response, re.DOTALL)
            if json_match:
                try:
                    plan = json.loads(json_match.group())
                    return plan
                except json.JSONDecodeError:
                    return {"error": "JSON parsing failed", "response_sample": response[:200]}
        
        return {"error": "No response from Arli API"}
        
    except Exception as e:
        print(f"Error generating trip plan: {e}")
        return {"error": str(e)}


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
        
        response = _call_arli_api(prompt, max_tokens=2000)
        
        if response:
            import re
            
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    return {"error": "Could not parse itinerary"}
        
        return {"error": "No response from Arli API"}
        
    except Exception as e:
        print(f"Error generating itinerary for {place_name}: {e}")
        return {"error": str(e)}


def get_group_trip_suggestion(places: List[str], interests: List[str], budget: str) -> str:
    """
    Get Arli's suggestion for the best place for a group trip
    
    Args:
        places: List of candidate destinations
        interests: List of group interests
        budget: Budget level (low/medium/high)
        
    Returns:
        Arli's recommendation text
    """
    try:
        places_str = ", ".join(places)
        interests_str = ", ".join(interests)
        
        prompt = f"""Among these destinations: {places_str}
        
        Which is best for a group interested in: {interests_str}
        Budget level: {budget}
        
        Provide a concise recommendation (2-3 sentences) explaining why this destination is the best choice for the group."""
        
        response = _call_arli_api(prompt, max_tokens=500)
        return response if response else "Unable to generate recommendation"
        
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
    print("Testing Arli Handler...\n")
    
    # Test place description
    print("=" * 50)
    print("Test 1: Place Description")
    print("=" * 50)
    try:
        desc = get_place_description("Jaipur")
        print(f"Jaipur: {desc}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test place info
    print("=" * 50)
    print("Test 2: Place Information")
    print("=" * 50)
    try:
        info = get_place_info("Manali")
        print(json.dumps(info, indent=2))
        print()
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Test trip itinerary
    print("=" * 50)
    print("Test 3: Trip Itinerary")
    print("=" * 50)
    try:
        itinerary = get_trip_itinerary("Goa", days=3, interests=["beach", "food", "relaxation"])
        print(json.dumps(itinerary, indent=2))
    except Exception as e:
        print(f"Error: {e}")
