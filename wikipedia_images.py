"""
Wikipedia Image Fetcher for TripSync
Fetches real place images from Wikipedia/Wikimedia Commons
"""

import requests
from typing import Optional, List
import time

WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": "TripSync/1.0 (Travel Recommendation App; educational project)"
}

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
        # Try different search titles
        search_titles = []
        if state:
            search_titles.append(f"{place_name}, {state}")
            search_titles.append(f"{place_name} ({state})")
        search_titles.append(place_name)
        search_titles.append(f"{place_name} (India)")
        search_titles.append(place_name)  # fallback

        for search_title in search_titles:
            if not search_title:
                continue

            params = {
                "action": "query",
                "prop": "images",
                "format": "json",
                "titles": search_title,
                "imlimit": limit + 10  # Get more to filter
            }

            response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=5)
            if response.status_code != 200:
                continue

            data = response.json()
            pages = data.get("query", {}).get("pages", {})

            # Get first page
            page_id = list(pages.keys())[0]
            if page_id == "-1":
                continue  # Try next title

            images = pages[page_id].get("images", [])
            if not images:
                continue

            # Step 2: Convert file names to actual URLs
            image_urls = []
            for img in images[:limit * 2]:
                file_title = img.get("title", "")

                # Skip SVG and non-photo files
                if ".svg" in file_title.lower() or "logo" in file_title.lower() or "flag" in file_title.lower() or "map" in file_title.lower() or "icon" in file_title.lower():
                    continue

                # Get actual image URL
                url = get_image_url(file_title)
                if url:
                    image_urls.append(url)
                    if len(image_urls) >= limit:
                        break

                # Small delay to avoid rate limiting
                time.sleep(0.1)

            if image_urls:
                print(f"✓ Found {len(image_urls)} images for {place_name} using '{search_title}'")
                return image_urls

        print(f"No images found for {place_name} on any Wikipedia page")
        return []

    except Exception as e:
        print(f"Error fetching images for {place_name}: {e}")
        return []


def get_image_url(file_title: str) -> Optional[str]:
    """
    Convert Wikipedia file title to direct image URL
    
    Args:
        file_title: Wikipedia file title (e.g., "File:Manali_town.jpg")
        
    Returns:
        Direct URL to the image or None
    """
    try:
        params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json"
        }
        
        response = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=5)
        if response.status_code != 200:
            return None
        
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        
        # Get the first (and only) page
        for page_id, page_data in pages.items():
            imageinfo = page_data.get("imageinfo", [])
            if imageinfo and len(imageinfo) > 0:
                return imageinfo[0].get("url")
        
        return None
        
    except Exception as e:
        print(f"Error getting URL for {file_title}: {e}")
        return None


def get_first_image(place_name: str, state: str = "") -> Optional[str]:
    """
    Get just the first/best image for a place (for card thumbnails)
    
    Args:
        place_name: Name of the place
        state: Optional state name
        
    Returns:
        Direct URL to the first image or None
    """
    images = get_place_images(place_name, state, limit=1)
    return images[0] if images else None
