"""
Unsplash Image Fetcher for TripSync
Fetches place images from Unsplash API and caches them in data/image_cache.json
Supports multiple images per place.

De-duplication strategy:
  1. Within a single fetch, the same photo ID is never returned twice.
  2. Across ALL cached places, a photo ID that already appears in the cache
     is never re-used for a new place (global dedup pool).
"""

import re
import requests
import json
import time
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

UNSPLASH_API = "https://api.unsplash.com/search/photos"
ACCESS_KEY = os.getenv("Access_Key")

CACHE_FILE = Path(__file__).resolve().parent / "data" / "image_cache.json"

# --------------- cache helpers ---------------

_mem_cache: dict | None = None


def load_cache() -> dict:
    global _mem_cache
    if _mem_cache is not None:
        return _mem_cache
    try:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _mem_cache = json.load(f)
        else:
            _mem_cache = {}
    except Exception as e:
        print(f"Error loading cache: {e}")
        _mem_cache = {}
    return _mem_cache


def save_cache(cache: dict):
    global _mem_cache
    _mem_cache = cache
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving cache: {e}")


def _cache_key(place_name: str, state: str = "") -> str:
    if state:
        return f"{place_name.strip().lower()}|{state.strip().lower()}"
    return place_name.strip().lower()


# --------------- dedup helpers ---------------

def _extract_photo_id(url: str) -> str | None:
    """Extract the Unsplash photo ID (photo-XXXX) from any Unsplash URL."""
    m = re.search(r"photo-([a-f0-9\-]+)", url)
    return m.group(0) if m else None


def _build_used_ids(cache: dict) -> set[str]:
    """
    Return the set of all Unsplash photo IDs that are already stored in
    the cache across every place.  Used to prevent cross-place duplicates.
    """
    used: set[str] = set()
    for entry in cache.values():
        for img in entry.get("images", []):
            pid = _extract_photo_id(img.get("url_raw", ""))
            if pid:
                used.add(pid)
    return used


# --------------- Unsplash fetch ---------------


def fetch_from_unsplash(
    query: str,
    place_name: str = "",
    per_page: int = 3,
    exclude_ids: set[str] | None = None,
) -> list[dict]:
    """
    Search Unsplash for images matching *query*.
    Prioritises photos whose alt/description mentions the place name.

    *exclude_ids* – set of Unsplash photo-XXXX strings to skip (global dedup).

    Returns a list of dicts:
        {
            "url_raw":   <raw Unsplash URL>,
            "url_full":  <full-res URL>,
            "url_regular": <1080w URL>,
            "url_small": <400w URL>,
            "url_thumb": <200w URL>,
            "alt":       <description / alt text>,
            "author":    <photographer name>,
            "author_url": <photographer profile link>,
            "unsplash_link": <photo page on Unsplash>
        }
    """
    if not ACCESS_KEY:
        print("ERROR: UNSPLASH_ACCESS_KEY not set in .env")
        return []

    if exclude_ids is None:
        exclude_ids = set()

    # Request significantly more results so we have room to filter out
    # duplicates AND irrelevant results and still fill the quota.
    fetch_count = max(per_page * 5, 15)

    params = {
        "query": query,
        "per_page": fetch_count,
        "orientation": "landscape",
        "content_filter": "high",
    }
    headers = {"Authorization": f"Client-ID {ACCESS_KEY}"}

    try:
        resp = requests.get(UNSPLASH_API, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Unsplash API error for '{query}': {e}")
        return []

    # Build keyword list from place name for relevance check
    place_lower = place_name.lower()
    keywords = {w for w in place_lower.split() if len(w) > 2}
    keywords.add(place_lower)
    # Add travel-related words that signal a place photo
    travel_words = {"mountain", "valley", "river", "lake", "temple", "fort",
                    "beach", "hill", "city", "town", "village", "landscape",
                    "sunrise", "sunset", "snow", "forest", "bridge", "road",
                    "building", "architecture", "heritage", "view", "panorama"}

    def _build_photo(photo: dict) -> dict:
        urls = photo.get("urls", {})
        return {
            "url_raw": urls.get("raw", ""),
            "url_full": urls.get("full", ""),
            "url_regular": urls.get("regular", ""),
            "url_small": urls.get("small", ""),
            "url_thumb": urls.get("thumb", ""),
            "alt": photo.get("alt_description") or photo.get("description") or query,
            "author": photo.get("user", {}).get("name", ""),
            "author_url": photo.get("user", {}).get("links", {}).get("html", ""),
            "unsplash_link": photo.get("links", {}).get("html", ""),
        }

    def _is_relevant(photo: dict) -> bool:
        """Check if the photo's text mentions the place or travel-related content."""
        text = " ".join(filter(None, [
            photo.get("alt_description", ""),
            photo.get("description", ""),
        ])).lower()
        # Direct place-name match
        if any(kw in text for kw in keywords):
            return True
        # Travel / scenery related
        if any(tw in text for tw in travel_words):
            return True
        return False

    relevant: list[dict] = []
    fallback: list[dict] = []

    # Track photo IDs seen *within this single fetch* to dedup intra-result too
    seen_in_result: set[str] = set()

    for photo in data.get("results", []):
        pid = f"photo-{photo.get('id', '')}"

        # --- Skip if already used globally or already seen in this batch ---
        if pid in exclude_ids or pid in seen_in_result:
            continue
        seen_in_result.add(pid)

        entry = _build_photo(photo)
        if _is_relevant(photo):
            relevant.append(entry)
        else:
            fallback.append(entry)

        # Stop early once we have enough candidates
        if len(relevant) + len(fallback) >= per_page * 2:
            break

    # Prefer relevant photos; fill remaining slots from fallback
    combined = (relevant + fallback)[:per_page]
    return combined


# --------------- public API ---------------


def get_place_images(
    place_name: str, state: str = "", per_page: int = 3, force: bool = False
) -> list[dict]:
    """
    Return a list of image dicts for *place_name*.
    Checks cache first; fetches from Unsplash if missing or *force=True*.

    A global pool of already-used photo IDs (collected from the whole cache)
    is passed to the fetcher so no image is reused across different places.
    """
    key = _cache_key(place_name, state)
    cache = load_cache()

    if not force and key in cache and cache[key].get("images"):
        print(f"✓ Cache hit for '{place_name}'")
        return cache[key]["images"]

    # Build the global exclusion pool (all photo IDs already in cache)
    used_ids = _build_used_ids(cache)

    # Build a search query that gives better travel photos
    search_query = f"{place_name} {state} travel".strip() if state else f"{place_name} travel"
    print(f"⏳ Fetching images for '{place_name}' from Unsplash …")
    images = fetch_from_unsplash(
        search_query,
        place_name=place_name,
        per_page=per_page,
        exclude_ids=used_ids,
    )

    if images:
        cache[key] = {"place": place_name, "state": state, "images": images}
        save_cache(cache)
        print(f"✓ Cached {len(images)} images for '{place_name}'")
    else:
        print(f"⚠️  No Unsplash results for '{place_name}'")

    return images


def get_unique_image(
    place_name: str,
    state: str = "",
    used_urls: set[str] | None = None,
) -> Optional[str]:
    """
    Return a *url_regular* for *place_name* that is NOT already in *used_urls*.

    Strategy:
      1. Pull cached images for the place.
      2. Return the first cached URL not in *used_urls*.
      3. If every cached image is already taken, do a fresh Unsplash fetch
         that excludes both the global cache pool AND every URL in *used_urls*.
      4. Absolute fallback: return the first cached image even if repeated.
    """
    if used_urls is None:
        used_urls = set()

    images = get_place_images(place_name, state, per_page=3)

    # --- Step 1: find a cached image not yet used this response ---
    for img in images:
        url = img.get("url_regular") or img.get("url_small")
        if url and url not in used_urls:
            return url

    # --- Step 2: all cached images already used — fetch a fresh unique one ---
    print(f"⚠️  All cached images for '{place_name}' already used this request — fetching fresh…")
    cache = load_cache()
    # Build exclusion pool: all IDs in cache + IDs from used_urls
    exclude_ids = _build_used_ids(cache)
    for u in used_urls:
        pid = _extract_photo_id(u)
        if pid:
            exclude_ids.add(pid)

    search_query = f"{place_name} {state} travel".strip() if state else f"{place_name} travel"
    fresh = fetch_from_unsplash(
        search_query,
        place_name=place_name,
        per_page=1,
        exclude_ids=exclude_ids,
    )
    if fresh:
        return fresh[0].get("url_regular") or fresh[0].get("url_small")

    # --- Absolute fallback ---
    if images:
        return images[0].get("url_regular") or images[0].get("url_small")
    return None


def get_first_image(place_name: str, state: str = "") -> Optional[str]:
    """Backward-compat wrapper — prefer get_unique_image in new code."""
    return get_unique_image(place_name, state)


# --------------- batch helper ---------------


def fetch_all_places(places: list[dict], per_page: int = 3, delay: float = 1.0):
    """
    Batch-fetch images for a list of places.

    *places* is a list of dicts with at least a "place" key and optional "state".
    Example: [{"place": "Manali", "state": "Himachal Pradesh"}, ...]

    Unsplash free tier allows 50 req/hr — adjust *delay* accordingly.
    """
    total = len(places)
    for i, p in enumerate(places, 1):
        name = p.get("place", "")
        state = p.get("state", "")
        if not name:
            continue
        print(f"[{i}/{total}] ", end="")
        get_place_images(name, state, per_page=per_page)
        time.sleep(delay)
    print("Done!")


# --------------- CLI entry ---------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python get_images.py <place_name> [state]")
        print("   eg: python get_images.py Manali 'Himachal Pradesh'")
        sys.exit(1)

    place = sys.argv[1]
    st = sys.argv[2] if len(sys.argv) > 2 else ""
    imgs = get_place_images(place, st)
    print(json.dumps(imgs, indent=2))
