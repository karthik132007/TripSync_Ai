"""
change_shape.py
Encodes a Preferences object into the 72-dimensional feature vector
that matches the places DB schema used to train the user tower.

DB column order (after dropping id & place, positions 0–71):
  0   avg_cost_per_day
  1   trip_duration
  2   popularity_high
  3   popularity_medium
  4   popularity_offbeat
  5   popularity_very_high
  6   adventure
  7   beach
  8   bird_watching
  9   boating
  10  camping
  11  canyon
  12  caves
  13  culture
  14  desert
  15  food
  16  forest
  17  heritage
  18  history
  19  islands
  20  lakes
  21  luxury
  22  mountains
  23  nature
  24  nightlife
  25  offbeat
  26  paragliding
  27  peaceful
  28  rafting
  29  river
  30  romantic
  31  safari
  32  skiing
  33  spiritual
  34  trekking
  35  water_sports
  36  waterfalls
  37  apr
  38  aug
  39  dec
  40  feb
  41  jan
  42  jul
  43  jun
  44  mar
  45  may
  46  nov
  47  oct
  48  sep
  49  couple
  50  family
  51  friends
  52  solo
  53  total_cost_log
  54  region_africa       (not user-supplied → 0)
  55  region_europe
  56  region_middle_east
  57  region_north_america
  58  region_oceania
  59  region_south_asia
  60  region_southeast_asia
  61  climate_alpine       (not user-supplied → 0)
  62  climate_cold
  63  climate_continental
  64  climate_dry
  65  climate_highland
  66  climate_mediterranean
  67  climate_subtropical
  68  climate_temperate
  69  climate_tropical
  70  climate_nan
"""

import numpy as np
from math import log1p

# ── Lookup tables ──────────────────────────────────────────────────────────

# month name → db month column name (already in alphabetical order in the DB)
MONTH_INDEX = {
    "apr": 37, "aug": 38, "dec": 39, "feb": 40,
    "jan": 41, "jul": 42, "jun": 43, "mar": 44,
    "may": 45, "nov": 46, "oct": 47, "sep": 48,
    # Accept full names too
    "january": 41, "february": 40, "march": 44, "april": 37,
    "june": 43, "july": 42, "august": 38, "september": 48,
    "october": 47, "november": 46, "december": 39,
}

# tag → db column index
TAG_INDEX = {
    "adventure":   6, "beach":       7, "bird_watching": 8,
    "boating":     9, "camping":    10, "canyon":       11,
    "caves":      12, "culture":    13, "desert":       14,
    "food":       15, "forest":     16, "heritage":     17,
    "history":    18, "islands":    19, "lakes":        20,
    "luxury":     21, "mountains":  22, "nature":       23,
    "nightlife":  24, "offbeat":    25, "paragliding":  26,
    "peaceful":   27, "rafting":    28, "river":        29,
    "romantic":   30, "safari":     31, "skiing":       32,
    "spiritual":  33, "trekking":   34, "water_sports": 35,
    "waterfalls": 36,
    # Aliases returned by the frontend
    "water-sports": 35, "bird-watching": 8,
}

# best_for role → db column index
ROLE_INDEX = {
    "couple": 49, "family": 50, "friends": 51, "solo": 52,
    # Variants
    "honeymoon": 49, "romantic": 49, "couples": 49,
}

# popularity string → db column index
POPULARITY_INDEX = {
    "high":      2, "popular":   2,
    "medium":    3, "moderate":  3,
    "offbeat":   4, "hidden":    4, "emerging": 4,
    "very_high": 5, "very high": 5, "viral": 5,
    # "yes" / "no" from the popular field
    "yes": 2,   # popular = "yes"  →  high popularity preference
    "no":  4,   # popular = "no"   →  offbeat preference
}

# climate string → db column index
CLIMATE_INDEX = {
    "alpine":       61, "cold":         62,
    "continental":  63, "dry":          64,
    "highland":     65, "mediterranean": 66,
    "subtropical":  67, "temperate":    68,
    "tropical":     69,
    # climate_nan is 70, but we don't set it explicitly
}

# ── Encoder ────────────────────────────────────────────────────────────────

def change_shape(preferences) -> np.ndarray:
    """
    Convert a Preferences pydantic object into a (1, 71) numpy float32 array
    matching the places DB feature schema.

    preferences fields:
        month    : list[str]   e.g. ["may", "apr"]
        budget   : int         daily budget in USD (avg_cost_per_day proxy)
        duration : int         trip duration in days
        best_for : str         e.g. "couple"  / "solo"
        weather  : list[str]   climate preferences e.g. ["tropical", "temperate"]
        tags     : list[str]   e.g. ["beach", "culture"]
        popular  : str         "yes" / "no"
    """
    vec = np.zeros(71, dtype=np.float32)

    # ── 0. avg_cost_per_day  (total budget / duration)
    avg_cost = float(preferences.budget) / float(preferences.duration)
    # Clip to training data range [800, 12000] to avoid dominating other features
    vec[0] = np.clip(avg_cost, 800.0, 12000.0)

    # ── 1. trip_duration
    # Clip to training range [1, 12]
    vec[1] = np.clip(float(preferences.duration), 1.0, 12.0)

    # ── 2–5. popularity  (from the `popular` field)
    pop_key = str(preferences.popular).strip().lower()
    pop_idx = POPULARITY_INDEX.get(pop_key)
    if pop_idx is not None:
        vec[pop_idx] = 1.0

    # ── 6–36. activity tags  (multi-hot)
    for tag in (preferences.tags or []):
        idx = TAG_INDEX.get(str(tag).strip().lower().replace(" ", "_"))
        if idx is not None:
            vec[idx] = 1.0

    # ── 37–48. months  (multi-hot)
    for m in (preferences.month or []):
        idx = MONTH_INDEX.get(str(m).strip().lower())
        if idx is not None:
            vec[idx] = 1.0

    # ── 49–52. best_for  (single str → multi-hot where mapped)
    role_key = str(preferences.best_for).strip().lower()
    role_idx = ROLE_INDEX.get(role_key)
    if role_idx is not None:
        vec[role_idx] = 1.0

    # ── 53. total_cost_log  = log1p(total_budget)
    # Clip to training range [log1p(800*1), log1p(12000*12)] -> [6.7, 11.9]
    vec[53] = np.clip(float(log1p(preferences.budget)), 6.7, 11.9)

    # ── 54–60. region  (not user-supplied → leave as 0)

    # ── 61–69. climate preferences (multi-hot from weather field)
    for climate_pref in (preferences.weather or []):
        climate_key = str(climate_pref).strip().lower()
        climate_idx = CLIMATE_INDEX.get(climate_key)
        if climate_idx is not None:
            vec[climate_idx] = 1.0

    # ── 70. climate_nan (leave as 0 - not explicitly set)

    return vec.reshape(1, 71)