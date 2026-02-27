import sys, os
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('./backend'))

from backend.app import get_user_prefrences
from backend.pref_model import Preferences

print("--- Test 1: Validation Failure ---")
try:
    p = Preferences(
        month=["jan"],
        budget=10,
        duration=5,
        best_for="solo",
        weather=["tropical"],
        tags=["beach"],
        popular="yes"
    )
    print("Failed: Should have raised validation error. Instead got:", p)
except Exception as e:
    print("Passed: Validation Error Caught!")
    print(e)

print("\n--- Test 2: Success Integration ---")
try:
    p2 = Preferences(
        month=["jan"],
        budget=1000,
        duration=5,
        best_for="solo",
        weather=["tropical"],
        tags=["beach"],
        popular="yes"
    )
    res = get_user_prefrences(p2)
    places = res.get("data", [])
    print(f"Returned {len(places)} places")
    if places:
        print("First place keys:", places[0].keys())
        print("Score of first place:", places[0].get("confidence_score"))
        print("Place name of first place:", places[0].get("place"))
except Exception as e:
    print("Failed Test 2", e)
