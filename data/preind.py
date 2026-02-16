import json
import re

ALLOWED_TAGS = {
    "adventure",
    "beach",
    "bird-watching",
    "boating",
    "camping",
    "canyon",
    "caves",
    "culture",
    "desert",
    "food",
    "forest",
    "heritage",
    "history",
    "islands",
    "lakes",
    "luxury",
    "mountains",
    "nature",
    "nightlife",
    "offbeat",
    "paragliding",
    "peaceful",
    "rafting",
    "river",
    "romantic",
    "safari",
    "skiing",
    "spiritual",
    "trekking",
    "water-sports",
    "waterfalls",
}

def normalize_tag(t):
    if not isinstance(t, str):
        return None
    t = t.strip().lower()
    # Fix obvious issues like "nan"
    if t == "nan" or t == "":
        return None
    return t

def has_any(word_list, text):
    text_l = text.lower()
    return any(w.lower() in text_l for w in word_list)

def expand_tags_for_place(place_obj):
    name = place_obj.get("place", "") or ""
    existing_tags = place_obj.get("tags", []) or []
    best_for = place_obj.get("best_for", []) or []
    climate = (place_obj.get("climate") or "").lower()

    # 1. Clean existing tags to allowed set
    tags = []
    for t in existing_tags:
        nt = normalize_tag(t)
        if nt in ALLOWED_TAGS and nt not in tags:
            tags.append(nt)

    # 2. Feature flags
    name_l = name.lower()

    is_beach_place = (
        "beach" in tags
        or "islands" in tags
        or "island" in name_l
        or "beach" in name_l
        or has_any(["goa", "kovalam", "varkala", "gokarna"], name_l)
    )

    is_mountain_place = (
        "mountains" in tags
        or has_any(
            [
                "hill", "hills", "ghat", "ghats",
                "valley", "pass", "la", "top",
                "peak", "ked", "tawang", "gangtok",
                "darjeeling", "nainital", "ooty",
                "kodaikanal"
            ],
            name_l
        )
    )

    is_desert_place = (
        "desert" in tags
        or has_any(["rann", "thar", "jaisalmer", "bikaner"], name_l)
    )

    is_safari_place = (
        "safari" in tags
        or has_any(["national park", "tiger reserve", "wildlife", "sanctuary", "safari"], name_l)
    )

    is_waterfall_place = (
        "waterfalls" in tags
        or "falls" in name_l
        or "waterfall" in name_l
    )

    is_cave_place = (
        "caves" in tags
        or "cave" in name_l
        or has_any(["ajanta", "ellora", "badami"], name_l)
    )

    is_city_foody = (
        "food" in tags
        or has_any(["mumbai", "kolkata", "lucknow", "bangalore", "bengaluru", "chennai", "kolhapur", "ahmedabad"], name_l)
    )

    is_heritage_culture = any(t in tags for t in ["heritage", "culture", "history"])
    is_spiritual = "spiritual" in tags or has_any(
        ["temple", "ashram", "dham", "ganga", "ghat"],
        name_l
    )

    # 3. Derive from best_for
    best_for_lower = {str(x).lower() for x in best_for}

    candidate_tags = []

    # Couples → romantic, peaceful
    if "couples" in best_for_lower:
        candidate_tags += ["romantic", "peaceful"]

    # Friends → adventure, nightlife
    if "friends" in best_for_lower:
        candidate_tags += ["adventure", "nightlife"]

    # Family → peaceful, nature
    if "family" in best_for_lower:
        candidate_tags += ["peaceful", "nature"]

    # Solo → offbeat, peaceful
    if "solo" in best_for_lower:
        candidate_tags += ["offbeat", "peaceful"]

    # 4. Place-type-specific candidates

    if is_beach_place:
        candidate_tags += [
            "water-sports",
            "nature",
            "romantic",
            "peaceful",
            "adventure",
            "nightlife",
        ]

    if is_mountain_place:
        candidate_tags += [
            "nature",
            "trekking",
            "camping",
            "adventure",
            "peaceful",
            "waterfalls",
            "offbeat",
        ]

    if is_desert_place:
        candidate_tags += [
            "adventure",
            "offbeat",
            "culture",
            "safari",
            "camping",
            "peaceful",
        ]

    if is_safari_place:
        candidate_tags += [
            "nature",
            "forest",
            "adventure",
            "safari",
            "bird-watching",
            "offbeat",
            "camping",
        ]

    if is_waterfall_place:
        candidate_tags += [
            "waterfalls",
            "nature",
            "adventure",
            "trekking",
            "offbeat",
            "forest",
            "camping",
        ]

    if is_cave_place:
        candidate_tags += [
            "caves",
            "adventure",
            "history",
            "heritage",
            "offbeat",
            "trekking",
        ]

    if is_heritage_culture:
        candidate_tags += [
            "heritage",
            "history",
            "culture",
            "food",
            "spiritual",
            "offbeat",
        ]

    if is_spiritual:
        candidate_tags += [
            "spiritual",
            "peaceful",
            "culture",
            "river",
        ]

    if is_city_foody:
        candidate_tags += [
            "food",
            "nightlife",
            "culture",
        ]

    # Climate-based hints
    if "cold" in climate and is_mountain_place:
        candidate_tags += ["trekking", "camping", "skiing", "adventure"]

    # Generic fallbacks (used only if still not enough)
    generic_fallback = [
        "nature",
        "culture",
        "history",
        "food",
        "offbeat",
        "peaceful",
        "adventure",
    ]

    # 5. Merge candidates into tags, respecting ALLOWED_TAGS
    for ct in candidate_tags:
        nt = normalize_tag(ct)
        if nt in ALLOWED_TAGS and nt not in tags:
            tags.append(nt)

    # Ensure at least 7 tags; if less, add from generic fallback
    for gf in generic_fallback:
        if len(tags) >= 7:
            break
        if gf in ALLOWED_TAGS and gf not in tags:
            tags.append(gf)

    # Cap at 8 tags
    if len(tags) > 8:
        tags = tags[:8]

    place_obj["tags"] = tags
    return place_obj

def main():
    # Load original file
    with open("data/india.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # If the root is not a list, adapt as needed
    if not isinstance(data, list):
        raise ValueError("Expected india.json to contain a list of places")

    updated = []
    for place in data:
        updated.append(expand_tags_for_place(place))

    # Write updated file
    with open("india_updated.json", "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)

    print("Updated tags written to india_updated.json")

if __name__ == "__main__":
    main()
