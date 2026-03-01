"""
Unified Image Fetcher for TripSync (Unsplash + Wikimedia Commons)
Fetches place images from both sources and caches them in data/image_cache.json
Supports multiple images per place.

Refined Hybrid Strategy:
  1. Primary: Unsplash with descriptive "Scenic + Tag" queries.
  2. Fallback: Wikimedia with strict dimension and content filtering.
  3. Strict content filtering to avoid PDFs, maps, textures, and profile photos.
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

def _build_used_ids(cache: dict) -> set[str]:
    used: set[str] = set()
    for entry in cache.values():
        for img in entry.get("images", []):
            img_id = img.get("image_id")
            if img_id:
                used.add(img_id)
    return used

# --------------- Unsplash fetch ---------------

def _unsplash_build_photo(photo: dict, query: str) -> dict:
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

def fetch_from_unsplash(
    query: str,
    place_name: str = "",
    per_page: int = 3,
    exclude_ids: set[str] | None = None,
    tags: list[str] = None,
) -> list[dict]:
    if not ACCESS_KEY:
        return []

    if exclude_ids is None:
        exclude_ids = set()

    params = {
        "query": query,
        "per_page": per_page + 5,
        "orientation": "landscape",
        "content_filter": "high",
    }
    headers = {"Authorization": f"Client-ID {ACCESS_KEY}"}

    try:
        resp = requests.get(UNSPLASH_API, params=params, headers=headers, timeout=10)
        if resp.status_code in (403, 429):
            return []
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return []

    images = []
    seen_ids = set()
    for photo in data.get("results", []):
        img = _unsplash_build_photo(photo, query)
        if img["image_id"] in exclude_ids or img["image_id"] in seen_ids:
            continue
        images.append(img)
        seen_ids.add(img["image_id"])
        if len(images) >= per_page:
            break
    return images

# --------------- Wikimedia Commons fetch ---------------

def _wikimedia_build_photo(page: dict, query: str) -> dict | None:
    pageid = page.get("pageid")
    title = page.get("title", "").replace("File:", "", 1)
    
    # Strict Format Filtering
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    if not any(title.lower().endswith(ext) for ext in valid_extensions):
        return None

    # Blacklist irrelevant content
    blacklist = {
        "map", "icon", "logo", "profile", "user", "texture", "diagram", 
        "portrait", "census", "flag", "coat", "infobox", "banner",
        "placeholder", "black", "white", "transparent", "sign", "label", "pdf", "djvu"
    }
    title_lower = title.lower()
    if any(word in title_lower for word in blacklist):
        return None

    imageinfo = page.get("imageinfo", [])
    if not imageinfo:
        return None

    info = imageinfo[0]
    
    # Minimum Dimensions for high-quality scenic views
    width = info.get("width", 0)
    height = info.get("height", 0)
    if width < 1000 or height < 600: 
        return None
    
    # Aspect Ratio Filter (Prefer Landscapes)
    aspect_ratio = width / height
    if aspect_ratio < 0.8 or aspect_ratio > 2.5:
        return None

    url_raw = info.get("url")
    if not url_raw:
        return None

    thumb_url = info.get("thumburl")
    
    return {
        "image_id": f"commons-{pageid}",
        "url_raw": url_raw,
        "url_full": url_raw,
        "url_regular": thumb_url or url_raw,
        "url_small": thumb_url or url_raw,
        "url_thumb": thumb_url or url_raw,
        "alt": title,
        "author": info.get("user", "Unknown"),
        "author_url": f"https://commons.wikimedia.org/wiki/User:{info.get('user', '')}",
        "unsplash_link": f"https://commons.wikimedia.org/wiki/File:{title}",
        "source": "wikimedia",
    }

def fetch_from_wikimedia(
    query: str,
    place_name: str = "",
    per_page: int = 3,
    exclude_ids: set[str] | None = None,
) -> list[dict]:
    if exclude_ids is None:
        exclude_ids = set()

    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"intitle:{place_name} landscape scenic",
        "gsrnamespace": "6",
        "gsrlimit": 20,
        "prop": "imageinfo",
        "iiprop": "url|dimensions|user",
        "iiurlwidth": 1280,
        "format": "json",
    }
    headers = {"User-Agent": "TripSync/1.0 (contact@example.com)"}

    try:
        resp = requests.get(WIKIMEDIA_API, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return []

    pages = data.get("query", {}).get("pages", {})
    images = []
    seen_ids = set()

    for page in pages.values():
        img = _wikimedia_build_photo(page, query)
        if not img or img["image_id"] in exclude_ids or img["image_id"] in seen_ids:
            continue
        images.append(img)
        seen_ids.add(img["image_id"])
        if len(images) >= per_page:
            break
    return images

# --------------- public API ---------------

def get_place_images(
    place_name: str, state: str = "", per_page: int = 3, force: bool = False, tags: list[str] = None
) -> list[dict]:
    key = _cache_key(place_name, state)
    cache = load_cache()

    if not force and key in cache and cache[key].get("images"):
        return cache[key]["images"]

    used_ids = _build_used_ids(cache)
    
    # Refined Query building
    visual_tag_str = " ".join(tags[:2]) if tags else ""
    # Unsplash query: Focus on scenery
    unsplash_query = f"{place_name} {state} {visual_tag_str} travel scenic".strip()
    
    print(f"⏳ Fetching images for '{place_name}' from Unsplash (Primary)...")
    images = fetch_from_unsplash(unsplash_query, place_name, per_page, used_ids, tags)

    if len(images) < per_page:
        # Wiki Fallback with scenic focus
        needed = per_page - len(images)
        print(f"⏳ Fetching fallback images for '{place_name}' from Wikimedia...")
        wiki_images = fetch_from_wikimedia(place_name, place_name, needed, used_ids)
        images.extend(wiki_images)

    if images:
        cache[key] = {"place": place_name, "state": state, "images": images}
        save_cache(cache)
        print(f"✓ Cached {len(images)} images for '{place_name}'")
    else:
        print(f"⚠️  No images found for '{place_name}'")

    return images

def get_unique_image(
    place_name: str,
    state: str = "",
    used_urls: set[str] | None = None,
    tags: list[str] = None,
) -> Optional[str]:
    if used_urls is None:
        used_urls = set()

    images = get_place_images(place_name, state, per_page=3, tags=tags)

    for img in images:
        url = img.get("url_regular") or img.get("url_small")
        if url and url not in used_urls:
            return url
    
    return images[0].get("url_regular") if images else None

def get_first_image(place_name: str, state: str = "", tags: list[str] = None) -> Optional[str]:
    return get_unique_image(place_name, state, tags=tags)

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        sys.exit(1)
    imgs = get_place_images(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "")
    print(json.dumps(imgs, indent=2))
