#!/home/electron/Documents/Random Shit/.venv/bin/python
"""
Async Hotel Scraper — httpx + lxml
===================================
Collects hotel data from Booking.com for every place listed in places.json.
Saves structured results to data/hotels.json.

Features:
  • asyncio + httpx (HTTP/2, connection pooling)
  • lxml for fast HTML parsing
  • orjson / ujson / json fallback for serialisation
  • Concurrency-limited (default 75 simultaneous requests)
  • Retry with exponential back-off + jitter
  • Rotating user-agents + random delays
  • Incremental save every N places
  • Resume from where it stopped
  • Failed places logged to failed.json
  • Optional Playwright fallback for JS-rendered pages

Usage:
    python scrape_hotels.py                          # scrape all
    python scrape_hotels.py --start 0 --end 100      # range
    python scrape_hotels.py --concurrency 50         # throttle
    python scrape_hotels.py --no-resume              # fresh start
    python scrape_hotels.py --enrich-amenities       # visit detail pages
    python scrape_hotels.py --playwright             # use Playwright

Requirements:
    pip install httpx[http2] lxml cssselect
    pip install orjson              # optional, faster JSON
    pip install playwright          # optional, JS fallback
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import random
import re
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

# ── mandatory deps ───────────────────────────────────────────────────────
try:
    import httpx
except ImportError:
    sys.exit("✗ httpx not found. Install: pip install 'httpx[http2]'")

try:
    from lxml import html as lxml_html
    from lxml.html import HtmlElement
except ImportError:
    sys.exit("✗ lxml not found. Install: pip install lxml cssselect")

# ── curl_cffi (browser TLS impersonation — anti-bot bypass) ─────────────
try:
    from curl_cffi.requests import AsyncSession as CurlAsyncSession
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

# ── fast JSON (graceful fallback chain) ──────────────────────────────────
try:
    import orjson

    def _json_dumps(obj: Any) -> str:
        return orjson.dumps(
            obj, option=orjson.OPT_INDENT_2 | orjson.OPT_NON_STR_KEYS
        ).decode()

    def _json_loads(data: str | bytes) -> Any:
        return orjson.loads(data)

    _JSON_LIB = "orjson"
except ImportError:
    try:
        import ujson

        def _json_dumps(obj: Any) -> str:
            return ujson.dumps(obj, indent=2, ensure_ascii=False)

        def _json_loads(data: str | bytes) -> Any:
            return ujson.loads(data)

        _JSON_LIB = "ujson"
    except ImportError:

        def _json_dumps(obj: Any) -> str:
            return json.dumps(obj, indent=2, ensure_ascii=False)

        def _json_loads(data: str | bytes) -> Any:
            return json.loads(data)

        _JSON_LIB = "json"

# ═════════════════════════════════════════════════════════════════════════
#  PATHS & CONSTANTS
# ═════════════════════════════════════════════════════════════════════════
BASE_DIR = Path(__file__).resolve().parent
PLACES_JSON = BASE_DIR / "places.json"
HOTELS_JSON = BASE_DIR / "hotels.json"
FAILED_JSON = BASE_DIR / "failed.json"
LOG_FILE = BASE_DIR / "scrape_hotels.log"

MIN_HOTELS = 10
MAX_HOTELS = 30
MIN_AMENITIES = 5
MAX_AMENITIES = 10
DEFAULT_CONCURRENCY = 5         # very gentle — Booking blocks fast
DEFAULT_BATCH_SIZE = 5
SAVE_EVERY = 15  # incremental save every N places
REQUEST_TIMEOUT = 35.0
MAX_RETRIES = 5
DELAY_RANGE = (2.5, 5.5)       # between requests (seconds)
BATCH_DELAY = (5.0, 10.0)      # between batches (seconds)

# Browser versions curl_cffi can impersonate (rotated per-session)
CURL_IMPERSONATES = [
    "chrome124", "chrome126", "chrome131",
    "edge126", "edge131",
    "safari18_0",
]

# ── logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("hotel_scraper")

# ═════════════════════════════════════════════════════════════════════════
#  USER-AGENT ROTATION
# ═════════════════════════════════════════════════════════════════════════
USER_AGENTS = [
    # Chrome on Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    # Chrome on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    # Firefox
    "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
    # Safari
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]

ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.9,fr;q=0.8",
    "en-US,en;q=0.9,de;q=0.8",
    "en,en-US;q=0.9",
]


def _random_headers(referer: str | None = None) -> dict[str, str]:
    """Generate randomised browser-like headers with sec-ch-ua."""
    ua = random.choice(USER_AGENTS)
    is_chrome = "Chrome/" in ua and "Edg/" not in ua
    is_edge = "Edg/" in ua
    is_firefox = "Firefox/" in ua

    headers: dict[str, str] = {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": random.choice(ACCEPT_LANGUAGES),
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin" if referer else "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Priority": "u=0, i",
    }

    if referer:
        headers["Referer"] = referer

    # Chromium-based browsers send sec-ch-ua headers
    if is_chrome:
        m = re.search(r"Chrome/([\d]+)", ua)
        ver = m.group(1) if m else "126"
        headers["sec-ch-ua"] = f'"Chromium";v="{ver}", "Google Chrome";v="{ver}", "Not A(Brand";v="8"'
        headers["sec-ch-ua-mobile"] = "?0"
        headers["sec-ch-ua-platform"] = '"Linux"' if "Linux" in ua else '"Windows"' if "Windows" in ua else '"macOS"'
    elif is_edge:
        m = re.search(r"Edg/([\d]+)", ua)
        ver = m.group(1) if m else "126"
        headers["sec-ch-ua"] = f'"Chromium";v="{ver}", "Microsoft Edge";v="{ver}", "Not A(Brand";v="8"'
        headers["sec-ch-ua-mobile"] = "?0"
        headers["sec-ch-ua-platform"] = '"Windows"'

    return headers


# ═════════════════════════════════════════════════════════════════════════
#  AMENITY / TYPE MAPPINGS  (reused from existing scraper)
# ═════════════════════════════════════════════════════════════════════════
AMENITY_KEYWORDS: dict[str, str] = {
    # connectivity
    "wifi": "wifi", "wi-fi": "wifi", "internet": "wifi", "wireless": "wifi",
    # pool & water
    "pool": "pool", "swimming": "pool",
    "hot tub": "hot_tub", "jacuzzi": "hot_tub", "whirlpool": "hot_tub",
    "sauna": "sauna", "steam room": "sauna",
    # parking & transport
    "parking": "parking", "car park": "parking", "garage": "parking",
    "airport shuttle": "airport_shuttle", "shuttle": "airport_shuttle",
    "transfer": "airport_shuttle",
    # food & drink
    "breakfast": "breakfast", "morning meal": "breakfast",
    "restaurant": "restaurant", "dining": "restaurant",
    "bar": "bar", "lounge": "bar",
    "room service": "room_service", "mini bar": "minibar", "minibar": "minibar",
    # fitness & wellness
    "gym": "gym", "fitness": "gym", "exercise": "gym", "workout": "gym",
    "spa": "spa", "wellness": "spa", "massage": "spa", "treatment": "spa",
    # climate
    "air conditioning": "air_conditioning", "air-conditioning": "air_conditioning",
    "heating": "heating",
    # kitchen & laundry
    "kitchen": "kitchen", "kitchenette": "kitchen", "cooking": "kitchen",
    "laundry": "laundry", "washing machine": "laundry", "ironing": "laundry",
    # outdoor
    "balcony": "balcony", "terrace": "balcony", "patio": "balcony",
    "garden": "garden", "outdoor": "garden",
    "bbq": "bbq", "barbecue": "bbq", "grill": "bbq",
    "beach": "beach_access", "beachfront": "beach_access", "waterfront": "beach_access",
    # views
    "river view": "river_view", "river-view": "river_view",
    "ocean view": "ocean_view", "sea view": "ocean_view", "sea-view": "ocean_view",
    "mountain view": "mountain_view", "mountain-view": "mountain_view",
    "city view": "city_view", "lake view": "lake_view",
    # pets
    "pet": "pet_friendly", "dog": "pet_friendly", "pets allowed": "pet_friendly",
    # safety & services
    "24-hour front desk": "24hr_front_desk", "front desk": "24hr_front_desk",
    "reception": "24hr_front_desk",
    "safe": "safe", "safety deposit": "safe",
    "concierge": "concierge",
    "elevator": "elevator", "lift": "elevator",
    "non-smoking": "non_smoking", "no smoking": "non_smoking",
    "family room": "family_rooms", "family": "family_rooms",
    # entertainment
    "tv": "tv", "television": "tv", "flat-screen": "tv", "cable": "tv",
    "game room": "game_room", "play": "game_room",
    # extras
    "free cancellation": "free_cancellation",
    "wheelchair": "wheelchair_accessible", "accessible": "wheelchair_accessible",
    "business": "business_center", "meeting room": "business_center",
    "hair dryer": "hair_dryer", "hairdryer": "hair_dryer",
    "coffee": "coffee_maker", "tea": "coffee_maker", "kettle": "coffee_maker",
    "towel": "towels", "linen": "towels",
}

TYPE_KEYWORDS: dict[str, str] = {
    "hostel": "hostel", "backpacker": "hostel", "dorm": "hostel",
    "resort": "resort", "boutique": "boutique", "lodge": "resort",
    "villa": "resort", "motel": "budget", "inn": "budget",
    "guest house": "budget", "guesthouse": "budget",
    "bed and breakfast": "budget", "b&b": "budget",
    "apartment": "budget", "luxury": "luxury", "palace": "luxury",
    "5-star": "luxury", "premium": "luxury",
}

_COMMON_AMENITIES_BY_TYPE: dict[str, list[str]] = {
    "luxury": [
        "wifi", "pool", "spa", "gym", "restaurant", "bar",
        "room_service", "air_conditioning", "parking", "breakfast",
        "concierge", "elevator",
    ],
    "resort": [
        "wifi", "pool", "restaurant", "garden", "parking", "bar",
        "spa", "breakfast", "air_conditioning", "balcony",
    ],
    "boutique": [
        "wifi", "breakfast", "air_conditioning", "bar", "concierge",
        "restaurant", "laundry", "garden",
    ],
    "hostel": [
        "wifi", "laundry", "kitchen", "24hr_front_desk", "non_smoking", "tv",
    ],
    "budget": [
        "wifi", "parking", "air_conditioning", "tv", "24hr_front_desk",
        "non_smoking", "elevator",
    ],
    "mid-range": [
        "wifi", "parking", "breakfast", "air_conditioning", "tv",
        "elevator", "restaurant", "laundry",
    ],
}


# ═════════════════════════════════════════════════════════════════════════
#  TEXT / PARSING HELPERS
# ═════════════════════════════════════════════════════════════════════════
def _clean(text: str | None) -> str:
    """Strip and normalise whitespace."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _text(el: HtmlElement | None) -> str:
    """Get cleaned text_content from an lxml element."""
    if el is None:
        return ""
    return _clean(el.text_content())


def _try_css(root: HtmlElement, selectors: list[str]) -> list[HtmlElement]:
    """Try multiple CSS selectors; return first non-empty result."""
    for sel in selectors:
        try:
            result = root.cssselect(sel)
            if result:
                return result
        except Exception:
            continue
    return []


def _parse_price(text: str) -> int | None:
    """Extract numeric price from text like '₹ 6,256' or '$120'."""
    if not text:
        return None
    nums = re.findall(r"[\d,]+", text.replace(" ", ""))
    if nums:
        try:
            return int(nums[0].replace(",", ""))
        except ValueError:
            return None
    return None


def _parse_rating(text: str) -> float | None:
    """Normalise rating to 0–5 scale.  Booking uses 0–10."""
    if not text:
        return None
    match = re.search(r"(\d+\.?\d*)", text)
    if match:
        val = float(match.group(1))
        if val > 5:
            return round(val / 2, 1)
        return round(val, 1)
    return None


def _parse_distance_km(text: str) -> float | None:
    """Extract distance from downtown as a float in km.

    Handles patterns like:
      '3.7 km from downtown'
      '800 m from centre'
      '1.2 km from center'
      '2 miles from downtown'
    """
    if not text:
        return None
    text_lower = text.lower()
    # match km
    m = re.search(r"([\d,.]+)\s*km", text_lower)
    if m:
        try:
            return round(float(m.group(1).replace(",", "")), 1)
        except ValueError:
            pass
    # match metres
    m = re.search(r"([\d,.]+)\s*(?:m|metres?|meters?)\b", text_lower)
    if m:
        try:
            return round(float(m.group(1).replace(",", "")) / 1000, 1)
        except ValueError:
            pass
    # match miles → km
    m = re.search(r"([\d,.]+)\s*(?:mi|miles?)\b", text_lower)
    if m:
        try:
            return round(float(m.group(1).replace(",", "")) * 1.60934, 1)
        except ValueError:
            pass
    return None


def _extract_amenities(text: str) -> list[str]:
    """Map raw amenity text to canonical amenity names."""
    text_lower = text.lower()
    found: set[str] = set()
    for kw, canonical in AMENITY_KEYWORDS.items():
        if kw in text_lower:
            found.add(canonical)
    return sorted(found)


def _classify_hotel_type(
    name: str, stars: int | None, price: int | None
) -> str:
    """Guess hotel type from name keywords, star rating, and price."""
    name_lower = name.lower()
    for kw, htype in TYPE_KEYWORDS.items():
        if kw in name_lower:
            return htype
    if stars:
        if stars >= 5:
            return "luxury"
        if stars <= 2:
            return "budget"
    if price:
        if price >= 15_000:
            return "luxury"
        if price <= 2_000:
            return "budget"
    return "mid-range"


def _ensure_min_amenities(amenities: list[str], hotel_type: str) -> list[str]:
    """Pad amenities with common defaults for the hotel type if below MIN."""
    if len(amenities) >= MIN_AMENITIES:
        return amenities[:MAX_AMENITIES]
    pool = _COMMON_AMENITIES_BY_TYPE.get(
        hotel_type, _COMMON_AMENITIES_BY_TYPE["mid-range"]
    )
    existing = set(amenities)
    for a in pool:
        if a not in existing:
            amenities.append(a)
            existing.add(a)
        if len(amenities) >= MIN_AMENITIES:
            break
    return amenities[:MAX_AMENITIES]


# ═════════════════════════════════════════════════════════════════════════
#  HTML PARSERS  (Booking.com search results)
# ═════════════════════════════════════════════════════════════════════════
def _parse_card(card: HtmlElement, place: str, country: str) -> dict | None:
    """Parse a single Booking.com property-card element → hotel dict."""

    # ── hotel name ───────────────────────────────────────────────────
    name_els = _try_css(card, [
        '[data-testid="title"]',
        ".sr-hotel__name",
        "h3 a span",
        "a[data-testid='title-link'] div",
    ])
    name = _text(name_els[0]) if name_els else ""
    if not name:
        return None

    # ── price ────────────────────────────────────────────────────────
    price: int | None = None
    price_els = _try_css(card, [
        '[data-testid="price-and-discounted-price"]',
        "span[data-testid='price-and-discounted-price']",
        ".bui-price-display__value",
        ".prco-valign-middle-helper",
        "[class*='price']",
    ])
    if price_els:
        price = _parse_price(_text(price_els[0]))

    # ── stars ────────────────────────────────────────────────────────
    stars: int | None = None
    star_els = _try_css(card, [
        "[data-testid='rating-stars'] span",
        "[data-testid='rating-stars'] svg",
        ".bui-rating .fcd9eec8fb",
        "[class*='stars'] span",
        "[class*='stars'] svg",
    ])
    if star_els:
        # try aria-label first
        parent = star_els[0].getparent()
        if parent is not None:
            aria = parent.get("aria-label", "")
            m = re.search(r"(\d)\s*(?:out of|star|/)", aria, re.I)
            if m:
                stars = int(m.group(1))
        if stars is None:
            stars = len(star_els)
            if stars > 5:
                stars = 5

    # ── rating ───────────────────────────────────────────────────────
    rating: float | None = None
    rating_els = _try_css(card, [
        "[data-testid='review-score']",
        ".bui-review-score__badge",
        "[class*='review-score']",
    ])
    if rating_els:
        rating = _parse_rating(_text(rating_els[0]))

    # ── hotel link ───────────────────────────────────────────────────
    link: str | None = None
    link_els = _try_css(card, [
        "a[data-testid='title-link']",
        "a[data-testid='property-card-desktop-single-image']",
        "h3 a",
        "a.hotel_name_link",
        "a[href*='/hotel/']",
    ])
    if link_els:
        href = link_els[0].get("href", "")
        if href:
            link = f"https://www.booking.com{href}" if href.startswith("/") else href
            # clean tracking params but keep essential ones
            link = re.sub(r"&highlight_room=.*", "", link)

    # ── amenities from card ──────────────────────────────────────────
    amenity_text = ""
    amenity_els = _try_css(card, [
        "[data-testid='property-card-unit-configuration']",
        "[class*='facility']",
        "[class*='amenity']",
        "[class*='popular']",
    ])
    if amenity_els:
        amenity_text = " ".join(_text(el) for el in amenity_els)

    amenities = _extract_amenities(amenity_text)

    # ── distance from downtown ────────────────────────────────────────
    distance_km: float | None = None
    dist_els = _try_css(card, [
        "[data-testid='distance']",
        "[data-testid='address']",
        "[data-testid='location']",
        ".sr_card_address_line",
    ])
    for el in dist_els:
        t = _text(el)
        if t:
            distance_km = _parse_distance_km(t)
            if distance_km is not None:
                break

    # ── hotel type ───────────────────────────────────────────────────
    hotel_type = _classify_hotel_type(name, stars, price)
    amenities = _ensure_min_amenities(amenities, hotel_type)

    return {
        "hotel_name": name,
        "price_per_night": price,
        "rating": rating,
        "stars": stars,
        "amenities": amenities[:MAX_AMENITIES],
        "hotel_link": link,
        "hotel_type": hotel_type,
        "distance_from_downtown_km": distance_km,
    }


def parse_search_results(
    html_content: str, place: str, country: str
) -> list[dict]:
    """Parse Booking.com search-results HTML → list of hotel dicts."""
    try:
        tree = lxml_html.fromstring(html_content)
    except Exception as e:
        log.error(f"HTML parse error for {place}: {e}")
        return []

    cards = _try_css(tree, [
        "[data-testid='property-card']",
        "div[data-testid='property-card-container']",
        ".sr_property_block",
    ])

    if not cards:
        # fallback: look for any <div> containing hotel-like links
        cards = _try_css(tree, ["div[class*='property']", "div[class*='hotel']"])

    if not cards:
        return []

    hotels: list[dict] = []
    seen: set[str] = set()

    for card in cards[: MAX_HOTELS + 10]:
        hotel = _parse_card(card, place, country)
        if not hotel:
            continue
        key = hotel["hotel_name"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        hotels.append(hotel)
        if len(hotels) >= MAX_HOTELS:
            break

    return hotels


# ═════════════════════════════════════════════════════════════════════════
#  DETAIL-PAGE AMENITY ENRICHMENT
# ═════════════════════════════════════════════════════════════════════════
def parse_detail_amenities(html_content: str) -> list[str]:
    """Extract amenities from a hotel detail page HTML."""
    try:
        tree = lxml_html.fromstring(html_content)
    except Exception:
        return []

    text_parts: list[str] = []
    selectors = [
        "[data-testid='facility-group-icon']",
        ".hotel-facilities-group",
        "#hp_facilities_box li",
        ".facilitiesChecklist__label",
        "[data-testid='property-most-popular-facilities-wrapper']",
        ".hp--popular_facilities li",
        ".important_facility",
        "[class*='FacilityGroup']",
        "[class*='facility']",
        "[class*='amenity']",
        "[class*='Amenity']",
    ]
    for sel in selectors:
        try:
            for el in tree.cssselect(sel):
                t = _text(el)
                if t:
                    text_parts.append(t)
        except Exception:
            continue

    return _extract_amenities(" ".join(text_parts))


# ═════════════════════════════════════════════════════════════════════════
#  ASYNC HTTP LAYER  (curl_cffi primary, httpx fallback)
# ═════════════════════════════════════════════════════════════════════════

# ── Global adaptive delay — increases when site pushes back ─────────────
_adaptive_delay: float = 0.0   # extra seconds added on 202/429/403
_session_request_count: int = 0  # requests made on current session


def _has_property_data(body: str) -> bool:
    """Check if the HTML body actually contains hotel property cards."""
    return (
        'data-testid="property-card"' in body
        or 'sr_property_block' in body
        or 'property-card-container' in body
    )


def _is_challenge_page(body: str) -> bool:
    """Detect anti-bot challenge / CAPTCHA pages."""
    lower = body[:8000].lower()
    indicators = (
        "captcha", "challenge", "are you a human",
        "browser check", "ray id", "cf-browser-verification",
        "just a moment", "enable javascript", "verify you are human",
        "access denied", "bot detection",
    )
    return any(w in lower for w in indicators)


async def _warm_cookies_curl(session: "CurlAsyncSession") -> None:
    """Hit the Booking.com homepage to pick up session cookies (curl_cffi)."""
    try:
        resp = await session.get(
            "https://www.booking.com/",
            headers=_random_headers(),
            timeout=20,
            allow_redirects=True,
        )
        n_cookies = len(session.cookies) if hasattr(session, 'cookies') else 0
        log.info(
            f"Cookie warm-up (curl_cffi): HTTP {resp.status_code}, "
            f"~{n_cookies} cookies"
        )
        await asyncio.sleep(random.uniform(1.5, 3.0))
    except Exception as e:
        log.warning(f"Cookie warm-up failed (curl_cffi): {e}")


async def _warm_cookies(client: httpx.AsyncClient) -> None:
    """Hit the Booking.com homepage once to pick up session cookies."""
    try:
        resp = await client.get(
            "https://www.booking.com/",
            headers=_random_headers(),
            timeout=20,
            follow_redirects=True,
        )
        log.info(
            f"Cookie warm-up: HTTP {resp.status_code}, "
            f"{len(resp.cookies)} cookies received"
        )
        await asyncio.sleep(random.uniform(1.5, 3.0))
    except Exception as e:
        log.warning(f"Cookie warm-up failed: {e}")


async def fetch_curl(
    session: "CurlAsyncSession",
    url: str,
    sem: asyncio.Semaphore,
    *,
    max_retries: int = MAX_RETRIES,
    label: str = "",
) -> str | None:
    """GET using curl_cffi with real browser TLS fingerprint.

    curl_cffi impersonates a real browser at the TLS/HTTP2 level,
    bypassing JA3/JA4 fingerprint detection that blocks httpx.
    """
    global _adaptive_delay, _session_request_count
    async with sem:
        for attempt in range(1, max_retries + 1):
            try:
                base_delay = random.uniform(*DELAY_RANGE) + _adaptive_delay
                await asyncio.sleep(base_delay)

                _session_request_count += 1
                referer = "https://www.booking.com/"
                resp = await session.get(
                    url,
                    headers=_random_headers(referer=referer),
                    timeout=REQUEST_TIMEOUT,
                    allow_redirects=True,
                )

                body = resp.text

                # ── 200 OK ──────────────────────────────────────────
                if resp.status_code == 200:
                    if _has_property_data(body) or not _is_challenge_page(body):
                        _adaptive_delay = max(0, _adaptive_delay - 0.3)
                        return body
                    # 200 but it's a challenge page — treat like 202
                    log.debug(f"200 but challenge page for {label}")

                # ── 202 Accepted — may contain data or be a challenge ─
                if resp.status_code in (200, 202):
                    if _has_property_data(body):
                        log.debug(f"{resp.status_code} with data for {label}")
                        _adaptive_delay = max(0, _adaptive_delay - 0.1)
                        return body
                    # challenge page — wait & retry
                    wait = 4 * attempt + random.uniform(2, 5)
                    _adaptive_delay = min(_adaptive_delay + 0.5, 10.0)
                    log.debug(
                        f"{resp.status_code} challenge ({label}), retry "
                        f"{attempt}/{max_retries}, wait {wait:.1f}s"
                    )
                    await asyncio.sleep(wait)
                    continue

                # ── 429 rate-limit ──────────────────────────────────
                if resp.status_code == 429:
                    wait = 2 ** (attempt + 2) + random.uniform(3, 8)
                    _adaptive_delay = min(_adaptive_delay + 2.0, 15.0)
                    log.warning(
                        f"429 rate-limit ({label}), back-off {wait:.1f}s"
                    )
                    await asyncio.sleep(wait)
                    continue

                # ── 403 forbidden ───────────────────────────────────
                if resp.status_code == 403:
                    _adaptive_delay = min(_adaptive_delay + 1.5, 12.0)
                    wait = 5 * attempt + random.uniform(3, 7)
                    log.warning(
                        f"403 forbidden ({label}), wait {wait:.1f}s"
                    )
                    await asyncio.sleep(wait)
                    continue

                log.debug(f"HTTP {resp.status_code} for {label}")

            except Exception as e:
                log.debug(f"curl_cffi error ({label}): {e}")
                await asyncio.sleep(2 ** attempt + random.uniform(1, 3))

    log.warning(f"All retries exhausted for {label}")
    return None


async def fetch(
    client: httpx.AsyncClient,
    url: str,
    sem: asyncio.Semaphore,
    *,
    max_retries: int = MAX_RETRIES,
    label: str = "",
) -> str | None:
    """GET with retry, adaptive backoff, semaphore, rotating headers.

    httpx fallback — used only when curl_cffi is unavailable.
    """
    global _adaptive_delay
    async with sem:
        for attempt in range(1, max_retries + 1):
            try:
                base_delay = random.uniform(*DELAY_RANGE) + _adaptive_delay
                await asyncio.sleep(base_delay)

                referer = "https://www.booking.com/"
                resp = await client.get(
                    url,
                    headers=_random_headers(referer=referer),
                    timeout=REQUEST_TIMEOUT,
                    follow_redirects=True,
                )

                body = resp.text

                # ── 200 OK — ideal ──────────────────────────────────
                if resp.status_code == 200:
                    if _has_property_data(body) or not _is_challenge_page(body):
                        _adaptive_delay = max(0, _adaptive_delay - 0.2)
                        return body

                # ── 202 Accepted — parse body anyway ────────────────
                if resp.status_code in (200, 202):
                    if _has_property_data(body):
                        log.debug(f"{resp.status_code} with data for {label}")
                        _adaptive_delay = max(0, _adaptive_delay - 0.1)
                        return body
                    # otherwise it's a JS challenge — wait & retry
                    wait = 4 * attempt + random.uniform(2, 4)
                    _adaptive_delay = min(_adaptive_delay + 0.5, 8.0)
                    log.debug(
                        f"{resp.status_code} challenge ({label}), "
                        f"retry {attempt}/{max_retries}, wait {wait:.1f}s"
                    )
                    await asyncio.sleep(wait)
                    continue

                # ── 429 rate-limit ──────────────────────────────────
                if resp.status_code == 429:
                    wait = 2 ** (attempt + 2) + random.uniform(2, 6)
                    _adaptive_delay = min(_adaptive_delay + 2.0, 15.0)
                    log.warning(
                        f"429 rate-limit ({label}), back-off {wait:.1f}s "
                        f"(adaptive now +{_adaptive_delay:.1f}s)"
                    )
                    await asyncio.sleep(wait)
                    continue

                # ── 403 forbidden ───────────────────────────────────
                if resp.status_code == 403:
                    _adaptive_delay = min(_adaptive_delay + 1.0, 12.0)
                    wait = 4 * attempt + random.uniform(2, 5)
                    log.warning(
                        f"403 forbidden ({label}), wait {wait:.1f}s, "
                        f"attempt {attempt}"
                    )
                    await asyncio.sleep(wait)
                    continue

                log.debug(f"HTTP {resp.status_code} for {label}")

            except httpx.TimeoutException:
                log.debug(f"Timeout ({label}), attempt {attempt}/{max_retries}")
                await asyncio.sleep(2 ** attempt + random.uniform(0, 2))
            except httpx.ConnectError as e:
                log.debug(f"Connect error ({label}): {e}")
                await asyncio.sleep(2 ** attempt + random.uniform(0, 2))
            except Exception as e:
                log.error(f"Unexpected fetch error ({label}): {e}")
                break

    log.warning(f"All retries exhausted for {label}")
    return None


def _build_search_url(place: str, country: str) -> str:
    """Build a Booking.com search URL for the given place."""
    query = f"{place}, {country}"
    checkin = datetime.now() + timedelta(days=30)
    checkout = checkin + timedelta(days=2)
    return (
        f"https://www.booking.com/searchresults.html"
        f"?ss={query.replace(' ', '+')}"
        f"&checkin={checkin.strftime('%Y-%m-%d')}"
        f"&checkout={checkout.strftime('%Y-%m-%d')}"
        f"&group_adults=2&no_rooms=1"
        f"&selected_currency=INR"
        f"&rows=40"
        f"&offset=0"
    )


async def scrape_place_httpx(
    client,  # httpx.AsyncClient or CurlAsyncSession
    place: str,
    country: str,
    sem: asyncio.Semaphore,
    *,
    enrich: bool = False,
    use_curl: bool = False,
) -> list[dict]:
    """Scrape hotels for one place using httpx or curl_cffi + lxml."""
    label = f"{place}, {country}"
    url = _build_search_url(place, country)

    _fetch = fetch_curl if use_curl else fetch
    html_content = await _fetch(client, url, sem, label=label)
    if not html_content:
        return []

    # detect captcha / challenge pages
    if _is_challenge_page(html_content):
        log.warning(f"Challenge page detected for {label}")
        return []

    hotels = parse_search_results(html_content, place, country)

    # if too few results, try a second page
    if len(hotels) < MIN_HOTELS:
        url2 = url.replace("&offset=0", "&offset=25")
        html2 = await _fetch(client, url2, sem, label=f"{label} p2")
        if html2:
            extra = parse_search_results(html2, place, country)
            seen = {h["hotel_name"].strip().lower() for h in hotels}
            for h in extra:
                if h["hotel_name"].strip().lower() not in seen:
                    hotels.append(h)
                    seen.add(h["hotel_name"].strip().lower())
                if len(hotels) >= MAX_HOTELS:
                    break

    # optionally enrich amenities from detail pages
    if enrich and hotels:
        _fetch_for_enrich = fetch_curl if use_curl else fetch
        await _enrich_amenities_generic(client, hotels, sem, _fetch_for_enrich)

    return hotels


async def _enrich_amenities_generic(
    client,
    hotels: list[dict],
    sem: asyncio.Semaphore,
    fetch_fn,
):
    """Visit detail pages for hotels lacking amenities."""
    tasks: list[tuple[int, asyncio.Task]] = []
    for i, h in enumerate(hotels):
        if len(h.get("amenities", [])) < MIN_AMENITIES and h.get("hotel_link"):
            task = asyncio.create_task(
                fetch_fn(client, h["hotel_link"], sem, label=h["hotel_name"])
            )
            tasks.append((i, task))

    for idx, task in tasks:
        html_content = await task
        if html_content:
            detail_amenities = parse_detail_amenities(html_content)
            if detail_amenities:
                merged = list(dict.fromkeys(hotels[idx]["amenities"] + detail_amenities))
                hotels[idx]["amenities"] = merged[:MAX_AMENITIES]


async def _enrich_amenities(
    client: httpx.AsyncClient,
    hotels: list[dict],
    sem: asyncio.Semaphore,
):
    """Visit detail pages for hotels lacking amenities (httpx)."""
    await _enrich_amenities_generic(client, hotels, sem, fetch)


# ═════════════════════════════════════════════════════════════════════════
#  PLAYWRIGHT SCRAPER  (primary engine — solves JS challenges)
# ═════════════════════════════════════════════════════════════════════════

# Stealth JS to inject before page loads — hides Playwright markers
_STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
window.chrome = { runtime: {} };
"""


async def scrape_place_playwright(
    place: str,
    country: str,
    pw_sem: asyncio.Semaphore,
    browser,
) -> list[dict]:
    """Use Playwright headless Chromium — solves JS challenges natively."""
    from playwright.async_api import TimeoutError as PWTimeout

    label = f"{place}, {country}"
    url = _build_search_url(place, country)

    async with pw_sem:
        ctx = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": random.choice([1366, 1920, 1440, 1536]),
                       "height": random.choice([768, 1080, 900])},
            locale="en-US",
            timezone_id="America/New_York",
        )
        page = await ctx.new_page()

        try:
            # Inject stealth script before navigation
            await page.add_init_script(_STEALTH_JS)

            # Navigate to search page
            await page.goto(url, wait_until="domcontentloaded", timeout=45_000)

            # Wait for the JS challenge to resolve (if present)
            # The challenge page will redirect/reload once solved
            try:
                await page.wait_for_selector(
                    '[data-testid="property-card"], .sr_property_block',
                    timeout=20_000,
                )
            except PWTimeout:
                # Maybe the challenge took longer — wait a bit more
                await asyncio.sleep(3)
                # Check if we got redirected to a challenge page
                content = await page.content()
                if _is_challenge_page(content) or not _has_property_data(content):
                    log.debug(f"Challenge page for {label}, waiting longer...")
                    try:
                        await page.wait_for_selector(
                            '[data-testid="property-card"]',
                            timeout=15_000,
                        )
                    except PWTimeout:
                        log.warning(f"Playwright: no results after challenge for {label}")
                        return []

            # Dismiss popups
            for sel in [
                'button#onetrust-accept-btn-handler',
                'button[aria-label="Dismiss sign-in info."]',
                'button.fc-cta-consent',
                '[data-testid="accept-btn"]',
            ]:
                try:
                    btn = page.locator(sel)
                    if await btn.count() > 0:
                        await btn.first.click(timeout=2000)
                        await asyncio.sleep(0.3)
                except Exception:
                    pass

            # Scroll to trigger lazy loading
            for _ in range(4):
                await page.evaluate("window.scrollBy(0, 1000)")
                await asyncio.sleep(random.uniform(0.5, 1.0))

            # Small random delay to seem human
            await asyncio.sleep(random.uniform(0.5, 1.5))

            html_content = await page.content()
            return parse_search_results(html_content, place, country)

        except PWTimeout:
            log.warning(f"Playwright timeout for {label}")
            return []
        except Exception as e:
            log.error(f"Playwright error for {label}: {e}")
            return []
        finally:
            await page.close()
            await ctx.close()


# ═════════════════════════════════════════════════════════════════════════
#  PERSISTENCE (atomic saves, resume support)
# ═════════════════════════════════════════════════════════════════════════
def load_json_file(path: Path) -> Any:
    """Load a JSON file, return empty dict/list on failure."""
    if not path.exists():
        return {}
    try:
        data = path.read_bytes()
        return _json_loads(data)
    except Exception as e:
        log.warning(f"Could not load {path}: {e}")
        return {}


def save_json_file(path: Path, data: Any) -> None:
    """Atomically write JSON (write .tmp then rename)."""
    tmp = path.with_suffix(".tmp")
    try:
        tmp.write_text(_json_dumps(data), encoding="utf-8")
        tmp.replace(path)
    except Exception as e:
        log.error(f"Save error for {path}: {e}")


# ═════════════════════════════════════════════════════════════════════════
#  MAIN ORCHESTRATOR
# ═════════════════════════════════════════════════════════════════════════
async def run(args: argparse.Namespace) -> None:
    """Main async entry point.

    Strategy:
      1. Try curl_cffi / httpx first (fast, concurrent).
      2. If the site returns JS challenges (202), automatically switch to
         Playwright which can execute the challenge JS.
      3. Playwright processes places sequentially through browser contexts
         with stealth patches to avoid detection.
    """
    global _adaptive_delay, _session_request_count
    t_start = time.monotonic()

    # ── load places ──────────────────────────────────────────────────
    with open(PLACES_JSON, "r", encoding="utf-8") as f:
        all_places: list[dict] = json.load(f)
    all_places = all_places[args.start : args.end]
    log.info(f"Loaded {len(all_places)} places from places.json")
    log.info(f"JSON library: {_JSON_LIB}")
    log.info(f"curl_cffi available: {HAS_CURL_CFFI}")

    # ── load existing data for resume ────────────────────────────────
    hotels_data: dict[str, list[dict]] = {}
    if args.resume:
        loaded = load_json_file(HOTELS_JSON)
        if isinstance(loaded, dict):
            hotels_data = loaded
        elif isinstance(loaded, list):
            for h in loaded:
                key = f"{h.get('place', '?')}, {h.get('country', '?')}"
                hotels_data.setdefault(key, []).append(h)
    done_keys = set(hotels_data.keys())
    log.info(f"Resuming: {len(done_keys)} places already scraped")

    failed_list: list[dict] = []
    if args.resume:
        loaded_f = load_json_file(FAILED_JSON)
        if isinstance(loaded_f, list):
            failed_list = loaded_f

    # ── filter remaining ─────────────────────────────────────────────
    remaining = [
        p for p in all_places
        if f"{p['place']}, {p['country']}" not in done_keys
    ]
    log.info(f"Remaining: {len(remaining)} places to scrape")

    if not remaining:
        log.info("Nothing to do — all places already scraped!")
        return

    # ── decide engine ────────────────────────────────────────────────
    # Default to Playwright since Booking.com now serves JS challenges
    # to non-browser clients. Use --no-playwright to force httpx/curl.
    use_playwright = args.playwright
    pw_browser = None

    if use_playwright:
        try:
            from playwright.async_api import async_playwright
            pw = await async_playwright().__aenter__()
            pw_browser = await pw.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                ],
            )
            log.info("Playwright browser launched ✓ (primary engine)")
        except ImportError:
            log.warning("Playwright not installed — pip install playwright && playwright install chromium")
            use_playwright = False
        except Exception as e:
            log.warning(f"Playwright launch failed: {e}")
            use_playwright = False

    sem = asyncio.Semaphore(args.concurrency)
    pw_sem = asyncio.Semaphore(min(args.concurrency, 3))  # limit browser tabs

    saved_count = 0
    total_hotels = sum(len(v) for v in hotels_data.values())
    consecutive_empty = 0

    # ── process in batches ───────────────────────────────────────
    for batch_start in range(0, len(remaining), args.batch_size):
        batch = remaining[batch_start : batch_start + args.batch_size]
        batch_num = batch_start // args.batch_size + 1
        total_batches = (len(remaining) + args.batch_size - 1) // args.batch_size
        log.info(
            f"━━ Batch {batch_num}/{total_batches} "
            f"({len(batch)} places, "
            f"engine={'Playwright' if use_playwright else 'curl_cffi' if HAS_CURL_CFFI else 'httpx'}) ━━"
        )

        if use_playwright and pw_browser:
            # ── Playwright path: sequential with delays ──────────
            results = []
            for p in batch:
                try:
                    result = await scrape_place_playwright(
                        p["place"], p["country"], pw_sem, pw_browser,
                    )
                    results.append(result)
                except Exception as e:
                    log.error(f"Exception for {p['place']}: {e}")
                    results.append(e)
                # Human-like delay between places
                await asyncio.sleep(random.uniform(*DELAY_RANGE))
        elif HAS_CURL_CFFI:
            # ── curl_cffi path ───────────────────────────────────
            impersonate = random.choice(CURL_IMPERSONATES)
            async with CurlAsyncSession(impersonate=impersonate) as session:
                await _warm_cookies_curl(session)
                tasks = [
                    asyncio.ensure_future(
                        scrape_place_httpx(
                            session, p["place"], p["country"], sem,
                            enrich=args.enrich_amenities, use_curl=True,
                        )
                    )
                    for p in batch
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            # ── httpx fallback ───────────────────────────────────
            limits = httpx.Limits(
                max_connections=args.concurrency + 10,
                max_keepalive_connections=min(args.concurrency, 20),
            )
            async with httpx.AsyncClient(
                http2=True, limits=limits,
                follow_redirects=True, timeout=REQUEST_TIMEOUT,
            ) as client:
                await _warm_cookies(client)
                tasks = [
                    asyncio.ensure_future(
                        scrape_place_httpx(
                            client, p["place"], p["country"], sem,
                            enrich=args.enrich_amenities, use_curl=False,
                        )
                    )
                    for p in batch
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

        # ── process results ──────────────────────────────────────
        batch_ok = 0
        for place_info, result in zip(batch, results):
            key = f"{place_info['place']}, {place_info['country']}"

            if isinstance(result, BaseException):
                log.error(f"  ✗ {key} — exception: {result}")
                failed_list.append({
                    "place": place_info["place"],
                    "country": place_info["country"],
                    "error": str(result),
                })
                continue

            if result:
                hotels_data[key] = result
                total_hotels += len(result)
                batch_ok += 1
                consecutive_empty = 0
                log.info(f"  ✓ {key}: {len(result)} hotels")
            else:
                consecutive_empty += 1
                failed_list.append({
                    "place": place_info["place"],
                    "country": place_info["country"],
                    "error": "no_results",
                })
                log.warning(f"  ✗ {key}: no hotels found")

            saved_count += 1

        # ── incremental save ─────────────────────────────────────
        if saved_count >= SAVE_EVERY or batch_start + args.batch_size >= len(remaining):
            save_json_file(HOTELS_JSON, hotels_data)
            save_json_file(FAILED_JSON, failed_list)
            elapsed = time.monotonic() - t_start
            log.info(
                f"  💾 Saved: {len(hotels_data)} places, "
                f"{total_hotels} hotels, "
                f"{len(failed_list)} failed "
                f"({elapsed:.0f}s elapsed)"
            )
            saved_count = 0

        # ── adaptive: if many failures, pause longer ─────────────
        if consecutive_empty >= 5:
            pause = min(consecutive_empty * 3, 45) + random.uniform(3, 8)
            log.warning(
                f"⚠ {consecutive_empty} consecutive empty — "
                f"pausing {pause:.0f}s to cool down"
            )
            await asyncio.sleep(pause)
            if consecutive_empty >= 10:
                log.warning("⚠ 10+ consecutive empty — site is blocking.")
                consecutive_empty = 0
        else:
            await asyncio.sleep(random.uniform(*BATCH_DELAY))

    # ── final save ───────────────────────────────────────────────────
    save_json_file(HOTELS_JSON, hotels_data)
    save_json_file(FAILED_JSON, failed_list)

    if pw_browser:
        await pw_browser.close()

    elapsed = time.monotonic() - t_start
    log.info(
        f"{'='*60}\n"
        f"  DONE in {elapsed:.1f}s\n"
        f"  Places scraped : {len(hotels_data)}\n"
        f"  Total hotels   : {total_hotels}\n"
        f"  Failed places  : {len(failed_list)}\n"
        f"  Output         : {HOTELS_JSON}\n"
        f"  Failed log     : {FAILED_JSON}\n"
        f"{'='*60}"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Fast async hotel scraper — Booking.com → hotels.json",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--start", type=int, default=0,
        help="Start index in places.json (default: 0)",
    )
    parser.add_argument(
        "--end", type=int, default=None,
        help="End index in places.json (exclusive)",
    )
    parser.add_argument(
        "--concurrency", type=int, default=DEFAULT_CONCURRENCY,
        help=f"Max simultaneous requests (default: {DEFAULT_CONCURRENCY})",
    )
    parser.add_argument(
        "--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
        help=f"Places per batch (default: {DEFAULT_BATCH_SIZE})",
    )
    parser.add_argument(
        "--no-resume", action="store_true",
        help="Start fresh (ignore existing hotels.json)",
    )
    parser.add_argument(
        "--enrich-amenities", action="store_true",
        help="Visit detail pages for full amenity lists (slower)",
    )
    parser.add_argument(
        "--no-playwright", action="store_true",
        help="Disable Playwright, use httpx/curl_cffi only (will fail if site serves JS challenges)",
    )
    parser.add_argument(
        "--playwright", action="store_true", default=True,
        help="Use Playwright headless browser (default: enabled)",
    )
    args = parser.parse_args()
    args.resume = not args.no_resume
    if args.no_playwright:
        args.playwright = False

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
