import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from ask_gpt import ask_llm
import json

preferences = {
    "duration": 3,
    "place": "Paris",
    "best_for": "Couples",
    "budget": 50000,
    "tags": "Romantic, Culture"
}

res = ask_llm(preferences)
print("---RAW RAW---")
print(res)
print("---END RAW---")
