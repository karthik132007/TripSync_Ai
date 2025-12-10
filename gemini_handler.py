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


def _call_arli_api(prompt: str, temperature: float = 0.7, max_tokens: int = 2000, retries: int = 2) -> str:
    """
    Call Arli API with given prompt
    
    Args:
        prompt: The prompt to send to Arli
        temperature: Creativity level (0-1)
        max_tokens: Maximum response length
        retries: Number of retries on timeout
        
    Returns:
        Response text from Arli API
    """
    last_error = None
    
    for attempt in range(retries + 1):
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
                        "content": "Travel expert. Output JSON only. Be specific, concise, authentic. No fluff."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "repetition_penalty": 1.1,
                "temperature": temperature,
                "top_p": 0.85,
                "top_k": 30,
                "max_completion_tokens": max_tokens,
                "stream": False
            })
            
            # Increased timeout to 120 seconds for slower API responses
            response = requests.post(ARLI_API_URL, headers=headers, data=payload, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                # Handle Arli response format
                if 'choices' in data and len(data['choices']) > 0:
                    return data['choices'][0]['message']['content']
                else:
                    return str(data)
            else:
                error_msg = f"Arli API error: {response.status_code} - {response.text[:200]}"
                print(f"Attempt {attempt + 1}/{retries + 1}: {error_msg}")
                last_error = error_msg
                if attempt < retries:
                    continue
                else:
                    raise Exception(error_msg)
                
        except requests.exceptions.Timeout as e:
            last_error = f"Arli API request timed out (attempt {attempt + 1}/{retries + 1})"
            print(last_error)
            if attempt < retries:
                print(f"Retrying... ({attempt + 1}/{retries})")
                continue
            else:
                raise Exception(last_error)
        except requests.exceptions.RequestException as e:
            last_error = f"Arli API connection error: {str(e)}"
            print(last_error)
            if attempt < retries:
                print(f"Retrying... ({attempt + 1}/{retries})")
                continue
            else:
                raise Exception(last_error)
        except Exception as e:
            print(f"Error calling Arli API: {e}")
            raise
    
    # Fallback in case all retries fail
    raise Exception(f"Arli API failed after {retries + 1} attempts: {last_error}")


def get_place_description(place_name: str) -> str:
    """
    Get a concise description of a place using Arli
    
    Args:
        place_name: Name of the place
        
    Returns:
        A 2-3 sentence description of the place
    """
    try:
        prompt = f"""2-3 sentences: What makes {place_name} special as a destination? Main attractions only. Be specific."""
        
        response = _call_arli_api(prompt, max_tokens=300)
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
        prompt = f"""JSON for {place_name}:
{{"description":"2 sentences","famous_foods":["dish1","dish2","dish3","dish4","dish5"],"cuisines":["type1","type2","type3"],"activities":["activity1","activity2","activity3","activity4"],"best_time_to_visit":"months","travel_tips":["tip1","tip2","tip3"]}}
Specific, authentic, valid JSON only."""
        
        response = _call_arli_api(prompt, max_tokens=1200)
        
        if response:
            import re
            
            response_clean = response.strip()
            
            # Try multiple extraction strategies
            json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response_clean, re.IGNORECASE)
            
            if not json_match:
                json_match = re.search(r'\{[\s\S]*\}', response_clean, re.DOTALL)
            
            if json_match:
                try:
                    json_str = json_match.group(1) if json_match.groups() else json_match.group()
                    json_str = json_str.strip()
                    data = json.loads(json_str)
                    
                    # Validate key fields exist
                    if "description" in data and "famous_foods" in data:
                        return data
                except json.JSONDecodeError:
                    pass
        
        return _create_fallback_response(place_name)
        
    except Exception as e:
        print(f"Error fetching place info for {place_name}: {e}")
        return _create_fallback_response(place_name)


def _generate_trip_plan_fallback(place_name: str, duration: int, role: str, budget: str, interests: List[str] = None) -> Dict:
    """Generate a structured trip plan when API fails"""
    budget_map = {
        "low": {"accommodation": "₹1000-1500", "food": "₹500-800", "activities": "₹500-1000", "transport": "₹500"},
        "medium": {"accommodation": "₹2000-3000", "food": "₹1000-1500", "activities": "₹1500-2000", "transport": "₹1000"},
        "high": {"accommodation": "₹4000-5000", "food": "₹2000-3000", "activities": "₹3000-5000", "transport": "₹2000"}
    }
    
    costs = budget_map.get(budget, budget_map["medium"])
    daily_total = {"low": "₹3500-5000", "medium": "₹5500-8000", "high": "₹10000-15000"}
    trip_total = {"low": f"₹{duration*4000}", "medium": f"₹{duration*6500}", "high": f"₹{duration*12000}"}
    
    daily_schedule = []
    for day in range(1, duration + 1):
        daily_schedule.append({
            "day": day,
            "morning": f"Explore {place_name} landmarks",
            "afternoon": "Local activities and sightseeing",
            "evening": "Relax and local cuisine",
            "cost": daily_total.get(budget, "₹6500-8000")
        })
    
    return {
        "trip_title": f"{duration}-Day {place_name} Adventure",
        "role": role,
        "budget": budget,
        "duration": str(duration),
        "daily_schedule": daily_schedule,
        "budget_breakdown": {
            "accommodation": costs.get("accommodation", "₹2000-3000"),
            "food": costs.get("food", "₹1000-1500"),
            "activities": costs.get("activities", "₹1500-2000"),
            "transport": costs.get("transport", "₹1000"),
            "total_per_day": daily_total.get(budget, "₹5500-8000"),
            "trip_total": trip_total.get(budget, f"₹{duration*6500}")
        },
        "must_see": [f"{place_name} - Main attraction", "Local heritage site", "Nature spot", "Cultural landmark"],
        "food_to_try": ["Local specialty 1", "Local specialty 2", "Street food", "Regional cuisine"],
        "getting_around": "Local transport, taxis, or guides recommended",
        "best_season": "October to March for most Indian destinations",
        "packing": ["Comfortable shoes", "Sun protection", "Camera", "Light clothing"],
        "tips": ["Respect local customs", "Try authentic food", "Book in advance", "Carry cash"]
    }


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
        
        prompt = f"""{duration}-day {place_name} trip: {role}, {budget} budget, interests: {interests_str}.
JSON only: {{"trip_title":"Title","role":"{role}","budget":"{budget}","duration":"{duration}","daily_schedule":[{{"day":1,"morning":"activity","afternoon":"activity","evening":"activity","cost":"₹500-1000"}}],"budget_breakdown":{{"accommodation":"₹X","food":"₹X","activities":"₹X","transport":"₹X","total_per_day":"₹X","trip_total":"₹X"}},"must_see":["place1","place2","place3","place4"],"food_to_try":["dish1","dish2","dish3","dish4"],"getting_around":"tips","best_season":"months","packing":["item1","item2","item3","item4"],"tips":["tip1","tip2","tip3","tip4"]}}"""

        response = _call_arli_api(prompt, temperature=0.4, max_tokens=1200)

        if response:
            import re

            # Clean up response - remove markdown, extra text
            response_clean = response.strip()
            
            # Multiple extraction strategies
            # Strategy 1: JSON in code block
            json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', response_clean, re.IGNORECASE)
            
            # Strategy 2: Direct JSON object
            if not json_match:
                json_match = re.search(r'\{[\s\S]*\}', response_clean, re.DOTALL)
            
            if json_match:
                try:
                    json_str = json_match.group(1) if json_match.groups() else json_match.group()
                    # Clean up JSON string
                    json_str = json_str.strip()
                    # Try to parse
                    plan = json.loads(json_str)
                    
                    # Validate required keys
                    required_keys = ["trip_title", "daily_schedule", "budget_breakdown", "must_see"]
                    if all(key in plan for key in required_keys):
                        return plan
                    else:
                        # Missing some keys, generate fallback
                        return _generate_trip_plan_fallback(place_name, duration, role, budget, interests)
                        
                except json.JSONDecodeError as e:
                    # JSON parsing failed, try to clean and retry
                    print(f"JSON parse error: {str(e)[:100]}")
                    return _generate_trip_plan_fallback(place_name, duration, role, budget, interests)
            else:
                # No JSON found in response
                print(f"No JSON structure found in response")
                return _generate_trip_plan_fallback(place_name, duration, role, budget, interests)

        return _generate_trip_plan_fallback(place_name, duration, role, budget, interests)
        
    except Exception as e:
        print(f"Error generating trip plan: {e}")
        return _generate_trip_plan_fallback(place_name, duration, role, budget, interests)


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
        
        prompt = f"""{days}-day {place_name} itinerary. Interests: {interests_str}.
JSON: {{"itinerary":[{{"day":1,"morning":"specific","afternoon":"specific","evening":"specific"}}],"recommendations":["3 tips"],"estimated_budget":"range","transportation_tips":"brief"}}
Specific activities. Realistic."""
        
        response = _call_arli_api(prompt, max_tokens=1200)
        
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
        
        prompt = f"""Best destination for group: {places_str}. Interests: {interests_str}, Budget: {budget}.
2 sentences. Pick one, explain why."""
        
        response = _call_arli_api(prompt, max_tokens=250)
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
