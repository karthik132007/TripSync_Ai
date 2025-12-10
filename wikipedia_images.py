"""
Wikipedia Image Fetcher for TripSync
Fetches real place images from Wikipedia/Wikimedia Commons with caching
"""

import requests
from typing import Optional, List
import time
import json
import os
from pathlib import Path

WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": "TripSync/1.0 (Travel Recommendation App; educational project)"
}

# Cache file path
CACHE_FILE = Path(__file__).resolve().parent / "data" / "image_cache.json"

# Global in-memory cache to prevent constant file reads and Live Server reloads
_mem_cache = None

def load_cache() -> dict:
    """Load image cache from memory or file"""
    global _mem_cache
    if _mem_cache is not None:
        return _mem_cache

    try:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                _mem_cache = json.load(f)
        else:
            _mem_cache = {}
    except Exception as e:
        print(f"Error loading cache: {e}")
        _mem_cache = {}
    
    return _mem_cache

def save_cache(cache: dict):
    """Update in-memory cache (File write disabled to prevent auto-reload)"""
    global _mem_cache
    _mem_cache = cache
    
    # NOTE: File writing is disabled because it triggers VS Code Live Server 
    # to reload the page immediately, causing the UI to reset.
    # To enable persistence, we would need to move the cache outside the workspace.
    
    # try:
    #     # Ensure data directory exists
    #     CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    #     with open(CACHE_FILE, 'w', encoding='utf-8') as f:
    #         json.dump(cache, f, indent=2, ensure_ascii=False)
    # except Exception as e:
    #     print(f"Error saving cache: {e}")

def get_from_cache(place_name: str, state: str = "") -> Optional[str]:
    """Get image URL from cache"""
    cache = load_cache()
    # Create cache key with state for better accuracy
    cache_key = f"{place_name.lower()}|{state.lower()}" if state else place_name.lower()
    return cache.get(cache_key)

def save_to_cache(place_name: str, image_url: str, state: str = ""):
    """Save image URL to cache"""
    cache = load_cache()
    cache_key = f"{place_name.lower()}|{state.lower()}" if state else place_name.lower()
    cache[cache_key] = image_url
    save_cache(cache)
    print(f"✓ Cached image for {place_name}")

def get_place_images(place_name: str, state: str = "", limit: int = 5) -> List[str]:
    """
    Fetch real image URLs for a place from Wikipedia

    Args:
        place_name: Name of the place
        state: Optional state name for disambiguation
        limit: Maximum number of images to fetch (default 5)

    Returns:
        List of direct image URLs
    """
    try:
        # Try different search strategies
        search_titles = []
        
        # Strategy 1: Try with state
        if state:
            search_titles.append(f"{place_name}, {state}")
            search_titles.append(f"{place_name} ({state})")
            search_titles.append(f"{place_name}, {state}, India")
        
        # Strategy 2: Try base name
        search_titles.append(place_name)
        search_titles.append(f"{place_name}, India")
        
        # Strategy 3: Try removing common suffixes
        clean_name = place_name.replace(" National Park", "").replace(" Valley", "").replace(" Lake", "").strip()
        if clean_name != place_name:
            search_titles.append(clean_name)
            if state:
                search_titles.append(f"{clean_name}, {state}")
        
        # Strategy 4: Try search for related terms
        if "valley" in place_name.lower():
            search_titles.append(f"{place_name.replace('Valley', '').strip()}")
        
        for search_title in search_titles:
            if not search_title:
                continue

            # Try regular Wikipedia page images
            params = {
                "action": "query",
                "prop": "images|pageimages",
                "format": "json",
                "titles": search_title,
                "imlimit": limit + 15,  # Get more to filter
                "piprop": "original"
            }

            response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=10)
            if response.status_code != 200:
                continue

            data = response.json()
            pages = data.get("query", {}).get("pages", {})

            # Get first page
            page_id = list(pages.keys())[0]
            if page_id == "-1":
                continue  # Try next title
            
            # First try to get the main page image (thumbnail)
            page_data = pages[page_id]
            main_image_url = page_data.get("original", {}).get("source")
            
            image_urls = []
            if main_image_url and not any(x in main_image_url.lower() for x in [".svg", "logo", "flag", "map", "icon"]):
                image_urls.append(main_image_url)

            image_urls = []
            if main_image_url and not any(x in main_image_url.lower() for x in [".svg", "logo", "flag", "map", "icon"]):
                image_urls.append(main_image_url)

            images = pages[page_id].get("images", [])
            if not images and not image_urls:
                continue

            # Step 2: Convert file names to actual URLs
            for img in images[:limit * 3]:  # Check more images
                file_title = img.get("title", "")

                # Skip unwanted file types
                lower_title = file_title.lower()
                if any(x in lower_title for x in [".svg", "logo", "flag", "coat", "seal", "emblem", "map", "icon", "commons-logo", "wikidata", "signature"]):
                    continue
                
                # Prefer JPG and PNG photos
                if not any(ext in lower_title for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                    continue

                # Get actual image URL
                url = get_image_url(file_title)
                if url:
                    image_urls.append(url)
                    if len(image_urls) >= limit:
                        break

                # Small delay to avoid rate limiting
                time.sleep(0.05)

            if image_urls:
                print(f"✓ Found {len(image_urls)} images for {place_name} using '{search_title}'")
                return image_urls
        
        # If Wikipedia fails, try Wikimedia Commons search
        commons_images = search_wikimedia_commons(place_name, state, limit)
        if commons_images:
            return commons_images

        print(f"⚠️ No images found for {place_name} on Wikipedia or Commons")
        return []

    except Exception as e:
        print(f"❌ Error fetching images for {place_name}: {e}")
        return []


def search_wikimedia_commons(place_name: str, state: str = "", limit: int = 5) -> List[str]:
    """
    Search Wikimedia Commons for images when Wikipedia page doesn't have good images
    
    Args:
        place_name: Name of the place
        state: Optional state name
        limit: Maximum number of images
        
    Returns:
        List of image URLs
    """
    try:
        search_query = f"{place_name} {state} India" if state else f"{place_name} India"
        
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": search_query,
            "srnamespace": "6",  # File namespace
            "srlimit": limit * 2
        }
        
        response = requests.get(WIKI_API.replace("en.wikipedia", "commons.wikimedia"), 
                              params=params, headers=HEADERS, timeout=10)
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        results = data.get("query", {}).get("search", [])
        
        image_urls = []
        for result in results:
            title = result.get("title", "")
            
            # Skip unwanted types
            lower_title = title.lower()
            if any(x in lower_title for x in [".svg", "logo", "flag", "map", "icon", "coat", "seal"]):
                continue
            
            url = get_image_url(title, use_commons=True)
            if url:
                image_urls.append(url)
                if len(image_urls) >= limit:
                    break
            
            time.sleep(0.05)
        
        if image_urls:
            print(f"✓ Found {len(image_urls)} images for {place_name} on Wikimedia Commons")
        
        return image_urls
        
    except Exception as e:
        print(f"Error searching Commons for {place_name}: {e}")
        return []


def get_image_url(file_title: str, use_commons: bool = False) -> Optional[str]:
    """
    Convert Wikipedia file title to direct image URL
    
    Args:
        file_title: Wikipedia file title (e.g., "File:Manali_town.jpg")
        use_commons: Whether to use Wikimedia Commons API
        
    Returns:
        Direct URL to the image or None
    """
    try:
        api_url = WIKI_API.replace("en.wikipedia", "commons.wikimedia") if use_commons else WIKI_API
        
        params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url|size",
            "format": "json",
            "iiurlwidth": 800  # Get reasonable size image
        }
        
        response = requests.get(api_url, params=params, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return None
        
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        
        # Get the first (and only) page
        for page_id, page_data in pages.items():
            imageinfo = page_data.get("imageinfo", [])
            if imageinfo and len(imageinfo) > 0:
                # Prefer thumb URL if available, otherwise use original
                return imageinfo[0].get("thumburl") or imageinfo[0].get("url")
        
        return None
        
    except Exception as e:
        print(f"Error getting URL for {file_title}: {e}")
        return None


def get_first_image(place_name: str, state: str = "") -> Optional[str]:
    """
    Get just the first/best image for a place (for card thumbnails)
    Uses cache to avoid redundant API calls
    
    Args:
        place_name: Name of the place
        state: Optional state name
        
    Returns:
        Direct URL to the first image or None
    """
    # Check cache first
    cached_url = get_from_cache(place_name, state)
    if cached_url:
        print(f"✓ Using cached image for {place_name}")
        return cached_url
    
    # Not in cache, fetch from Wikipedia
    print(f"⏳ Fetching image for {place_name} from Wikipedia...")
    images = get_place_images(place_name, state, limit=1)
    
    if images:
        image_url = images[0]
        # Save to cache for next time
        save_to_cache(place_name, image_url, state)
        return image_url
    
    return None
