"""
Unified Image Fetcher for TripSync (Unsplash + Wikimedia Commons)
Fetches place images from both sources and caches them in data/image_cache.json
Supports multiple images per place.

De-duplication strategy:
  1. Within a single fetch, the same image (by its unique ID) is never returned twice.
  2. Across ALL cached places, an image ID that already appears in the cache
     is never re-used for a new place (global dedup pool).
"""

import re
import requests
import json
import time
import os
from pathlib import Path
from typing import Optional, List, Dict, Set, Any
from dotenv import load_dotenv

load_dotenv()

# --------------- API Configuration ---------------

UNSPLASH_API = "https://api.unsplash.com/search/photos"
ACCESS_KEY = os.getenv("Access_Key")          # Unsplash Access Key

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

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

def _build_used_ids(cache: dict) -> set[str]:
    """
    Return the set of all image IDs that are already stored in the cache
    across every place. Used to prevent cross‑source duplicates.
    Each image dict must contain an "image_id" field.
    """
    used: set[str] = set()
    for entry in cache.values():
        for img in entry.get("images", []):
            img_id = img.get("image_id")
            if img_id:
                used.add(img_id)
    return used


# --------------- Unsplash fetch ---------------

def _unsplash_build_photo(photo: dict, query: str) -> dict:
    """Convert Unsplash API response to our standard image dict."""
    urls = photo.get("urls", {})
    photo_id = f"unsplash-{photo.get('id', '')}"
    return {
        "image_id": photo_id,
        "url_raw": urls.get("raw", ""),
        "url_full": urls.get("full", ""),
        "url_regular": urls.get("regular", ""),
        "url_small": urls.get("small", ""),
        "url_thumb": urls.get("thumb", ""),
        "alt": photo.get("alt_description") or photo.get("description") or query,
        "author": photo.get("user", {}).get("name", ""),
        "author_url": photo.get("user", {}).get("links", {}).get("html", ""),
        "unsplash_link": photo.get("links", {}).get("html", ""),
        "source": "unsplash",
    }


def _unsplash_is_relevant(photo: dict, place_name: str, tags: list[str] = None) -> bool:
    """Check if the photo's text mentions the place or travel-related content."""
    place_lower = place_name.lower()
    keywords = {w for w in place_lower.split() if len(w) > 2}
    keywords.add(place_lower)

    travel_words = {"mountain", "valley", "river", "lake", "temple", "fort",
                    "beach", "hill", "city", "town", "village", "landscape",
                    "sunrise", "sunset", "snow", "forest", "bridge", "road",
                    "building", "architecture", "heritage", "view", "panorama"}

    if tags:
        for tg in tags:
            travel_words.add(tg.lower())

    text = " ".join(filter(None, [
        photo.get("alt_description", ""),
        photo.get("description", ""),
    ])).lower()

    if any(kw in text for kw in keywords):
        return True
    if any(tw in text for tw in travel_words):
        return True
    return False


def fetch_from_unsplash(
    query: str,
    place_name: str = "",
    per_page: int = 3,
    exclude_ids: set[str] | None = None,
    tags: list[str] = None,
) -> list[dict]:
    """
    Search Unsplash for images matching *query*.
    Prioritises photos whose alt/description mentions the place name.
    """
    if not ACCESS_KEY:
        print("ERROR: UNSPLASH_ACCESS_KEY not set in .env")
        return []

    if exclude_ids is None:
        exclude_ids = set()

    # Request more results to allow filtering
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
        if resp.status_code in (403, 429):
            print(f"🛑 Unsplash API Rate Limit hit for '{query}' (50 req/hr). Falling back to placeholder.")
            return []
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Unsplash API error for '{query}': {e}")
        return []

    relevant: list[dict] = []
    fallback: list[dict] = []
    seen_ids: set[str] = set()

    for photo in data.get("results", []):
        img = _unsplash_build_photo(photo, query)
        img_id = img["image_id"]

        if img_id in exclude_ids or img_id in seen_ids:
            continue
        seen_ids.add(img_id)

        if _unsplash_is_relevant(photo, place_name, tags):
            relevant.append(img)
        else:
            fallback.append(img)

        if len(relevant) + len(fallback) >= per_page * 2:
            break

    # Prefer relevant photos, then fill with fallback
    combined = (relevant + fallback)[:per_page]
    return combined


# --------------- Wikimedia Commons fetch ---------------

def _wikimedia_build_photo(page: dict, query: str) -> dict | None:
    """Convert a Wikimedia Commons page to our standard image dict."""
    pageid = page.get("pageid")
    title = page.get("title", "").replace("File:", "", 1)
    imageinfo = page.get("imageinfo", [])
    if not imageinfo:
        return None

    info = imageinfo[0]
    # Original file URL
    url_raw = info.get("url")
    if not url_raw:
        return None

    # Thumbnail URLs – Commons provides a thumb URL template
    thumb_widths = {
        "url_regular": 1280,
        "url_small": 640,
        "url_thumb": 320,
    }
    urls = {"url_raw": url_raw, "url_full": url_raw}
    for key, width in thumb_widths.items():
        # Request a thumbnail at the given width
        thumb_info = info.get("thumburl")  # sometimes already present
        if thumb_info:
            # Try to modify the width in the thumb URL if possible
            # For simplicity, we use the provided thumburl as regular,
            # and construct smaller ones by replacing the width part.
            # This is heuristic but works for most Commons thumbs.
            urls[key] = thumb_info.replace("/thumb/", "/thumb/").replace(
                str(info.get("width", 1000)), str(width)
            )
        else:
            # Fallback: use the original URL (may be huge)
            urls[key] = url_raw

    # Author info
    user = info.get("user", "Unknown")
    user_page = f"https://commons.wikimedia.org/wiki/User:{user}" if user != "Unknown" else ""

    return {
        "image_id": f"commons-{pageid}",
        "url_raw": url_raw,
        "url_full": url_raw,
        "url_regular": urls.get("url_regular", url_raw),
        "url_small": urls.get("url_small", url_raw),
        "url_thumb": urls.get("url_thumb", url_raw),
        "alt": title,  # Better than nothing
        "author": user,
        "author_url": user_page,
        "unsplash_link": f"https://commons.wikimedia.org/wiki/File:{title}",  # page link
        "source": "wikimedia",
    }


def fetch_from_wikimedia(
    query: str,
    place_name: str = "",
    per_page: int = 3,
    exclude_ids: set[str] | None = None,
) -> list[dict]:
    """
    Search Wikimedia Commons for images matching *query* (place name).
    Returns a list of image dicts (same structure as Unsplash).
    """
    if exclude_ids is None:
        exclude_ids = set()

    # Request more than needed to allow filtering
    fetch_count = max(per_page * 3, 15)

    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",          # File namespace
        "gsrlimit": fetch_count,
        "prop": "imageinfo",
        "iiprop": "url|dimensions|user",
        "iiurlwidth": 1600,           # Request a medium thumbnail
        "format": "json",
    }
    headers = {"User-Agent": "TripSync/1.0 (https://tripsync.example.com; contact@example.com)"}

    try:
        resp = requests.get(WIKIMEDIA_API, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Wikimedia API error for '{query}': {e}")
        return []

    pages = data.get("query", {}).get("pages", {})
    images = []
    seen_ids = set()

    for page in pages.values():
        img = _wikimedia_build_photo(page, query)
        if not img:
            continue

        img_id = img["image_id"]
        if img_id in exclude_ids or img_id in seen_ids:
            continue
        seen_ids.add(img_id)

        # Simple relevance: prefer files whose title/description contains the place name
        # (We can improve later with category checks)
        place_lower = place_name.lower()
        title_lower = img.get("alt", "").lower()
        if place_lower in title_lower or any(word in title_lower for word in place_lower.split()):
            # Prioritise – we'll put relevant ones first later
            img["_relevance"] = True
        else:
            img["_relevance"] = False

        images.append(img)

        if len(images) >= per_page * 2:   # collect enough for sorting
            break

    # Sort: relevant first, then others
    images.sort(key=lambda x: x.get("_relevance", False), reverse=True)
    # Remove temporary flag
    for img in images:
        img.pop("_relevance", None)

    return images[:per_page]


# --------------- public API ---------------

def get_place_images(
    place_name: str, state: str = "", per_page: int = 3, force: bool = False, tags: list[str] = None
) -> list[dict]:
    """
    Return a list of image dicts for *place_name*.
    Checks cache first; fetches from Wikimedia + Unsplash if missing or *force=True*.

    Global dedup ensures no image ID is reused across different places.
    """
    key = _cache_key(place_name, state)
    cache = load_cache()

    if not force and key in cache and cache[key].get("images"):
        print(f"✓ Cache hit for '{place_name}'")
        return cache[key]["images"]

    # Build the global exclusion pool (all image IDs already in cache)
    used_ids = _build_used_ids(cache)

    # Build search query – add state and some travel hints
    visual_tags = {"beach", "mountain", "desert", "lake", "forest", "city", "snow",
                   "island", "river", "temple", "safari", "wildlife", "ocean",
                   "jungle", "history", "nature"}
    query_addons = []
    if tags:
        for t in tags:
            if t.lower() in visual_tags:
                query_addons.append(t.lower())
    addon_str = " ".join(query_addons)

    if state:
        search_query = f"{place_name} {state} {addon_str}".strip()
    else:
        search_query = f"{place_name} {addon_str}".strip()

    print(f"⏳ Fetching images for '{place_name}' from Wikimedia…")
    wikimedia_images = fetch_from_wikimedia(
        search_query,
        place_name=place_name,
        per_page=per_page,
        exclude_ids=used_ids,
    )

    # If Wikimedia returned enough images, we're done
    if len(wikimedia_images) >= per_page:
        images = wikimedia_images[:per_page]
    else:
        # Otherwise, fill the gap with Unsplash
        needed = per_page - len(wikimedia_images)
        print(f"⏳ Fetching additional images from Unsplash for '{place_name}'…")
        unsplash_images = fetch_from_unsplash(
            search_query,
            place_name=place_name,
            per_page=needed,
            exclude_ids=used_ids.union({img["image_id"] for img in wikimedia_images}),
            tags=tags,
        )
        images = wikimedia_images + unsplash_images

    if images:
        cache[key] = {"place": place_name, "state": state, "images": images}
        save_cache(cache)
        print(f"✓ Cached {len(images)} images for '{place_name}'")
    else:
        print(f"⚠️  No images found for '{place_name}' from any source")

    return images


def get_unique_image(
    place_name: str,
    state: str = "",
    used_urls: set[str] | None = None,
    tags: list[str] = None,
) -> Optional[str]:
    """
    Return a *url_regular* for *place_name* that is NOT already in *used_urls*.

    Strategy:
      1. Pull cached images for the place.
      2. Return the first cached URL not in *used_urls*.
      3. If every cached image is already taken, do a fresh fetch from both
         sources that excludes the global cache pool AND every URL in *used_urls*.
      4. Absolute fallback: return the first cached image even if repeated.
    """
    if used_urls is None:
        used_urls = set()

    images = get_place_images(place_name, state, per_page=3, tags=tags)

    # Step 1: find a cached image not yet used this response
    for img in images:
        url = img.get("url_regular") or img.get("url_small")
        if url and url not in used_urls:
            return url

    # Step 2: all cached images already used — fetch fresh ones
    print(f"⚠️  All cached images for '{place_name}' already used this request — fetching fresh…")
    cache = load_cache()
    # Build exclusion pool: all image IDs in cache + IDs from used_urls (we map URLs to IDs via cache)
    exclude_ids = _build_used_ids(cache)

    # Map used_urls to image_ids (if possible) – we need to find which cached image each URL belongs to.
    # Since used_urls are URLs, we can scan the cache for matching URLs and add their IDs.
    for entry in cache.values():
        for img in entry.get("images", []):
            url = img.get("url_regular") or img.get("url_small")
            if url and url in used_urls:
                img_id = img.get("image_id")
                if img_id:
                    exclude_ids.add(img_id)

    # Build search query (same as above)
    visual_tags = {"beach", "mountain", "desert", "lake", "forest", "city", "snow",
                   "island", "river", "temple", "safari", "wildlife", "ocean",
                   "jungle", "history", "nature"}
    query_addons = []
    if tags:
        for t in tags:
            if t.lower() in visual_tags:
                query_addons.append(t.lower())
    addon_str = " ".join(query_addons)

    if state:
        search_query = f"{place_name} {state} {addon_str}".strip()
    else:
        search_query = f"{place_name} {addon_str}".strip()

    # Try Wikimedia first
    fresh = fetch_from_wikimedia(
        search_query,
        place_name=place_name,
        per_page=1,
        exclude_ids=exclude_ids,
    )
    if fresh:
        return fresh[0].get("url_regular") or fresh[0].get("url_small")

    # Then Unsplash
    fresh = fetch_from_unsplash(
        search_query,
        place_name=place_name,
        per_page=1,
        exclude_ids=exclude_ids,
        tags=tags,
    )
    if fresh:
        return fresh[0].get("url_regular") or fresh[0].get("url_small")

    # Absolute fallback
    if images:
        return images[0].get("url_regular") or images[0].get("url_small")
    return None


def get_first_image(place_name: str, state: str = "", tags: list[str] = None) -> Optional[str]:
    """Backward-compat wrapper — prefer get_unique_image in new code."""
    return get_unique_image(place_name, state, tags=tags)


# --------------- batch helper ---------------

def fetch_all_places(places: list[dict], per_page: int = 3, delay: float = 1.0):
    """
    Batch-fetch images for a list of places.

    *places* is a list of dicts with at least a "place" key and optional "state".
    Example: [{"place": "Manali", "state": "Himachal Pradesh"}, ...]

    Unsplash free tier allows 50 req/hr – adjust *delay* accordingly.
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