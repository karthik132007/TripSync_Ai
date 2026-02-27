import sys, os
from pydantic import BaseModel
from typing import List, Optional
sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))

from engine.change_shape import change_shape
from engine.user_tower import get_user_embeddings
from engine.recommendations import get_top_10
from db.get_from_db import get_with_place_id
from db.search_in_json import search_place

class Preferences(BaseModel):
    month: List[str]
    budget: int
    duration: int
    best_for: str
    weather: List[str]
    tags: List[str]
    popular: str

prefs = Preferences(
    month=["jan", "feb"],
    budget=5000,
    duration=7,
    best_for="friends",
    weather=["tropical"],
    tags=["beach", "adventure", "islands", "water_sports", "paragliding"],
    popular="high"
)

embs = get_user_embeddings(prefs)
top_10, confs = get_top_10(embs, user_months=prefs.month)
names = get_with_place_id(top_10.tolist())

for name, conf in zip(names, confs):
    data = search_place(name)
    print(f"{name} ({conf:.1f}%) -> {data.get('tags', [])}")
