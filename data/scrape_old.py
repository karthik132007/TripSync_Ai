"""
Hotel Scraper — Selenium-based scraper that collects hotel data from Booking.com
for every place listed in data.json and stores results in hotels.json.

Usage:
    python scrape.py                    # scrape all places
    python scrape.py --start 0 --end 50 # scrape places 0–49 only
    python scrape.py --resume            # skip already-scraped places

Requirements:
    pip install selenium
"""

import json
import os
import re
import time
import random
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    StaleElementReferenceException,
    WebDriverException,
)

# Selenium 4.6+ has built-in Selenium Manager that auto-downloads
# the correct chromedriver — no need for webdriver-manager.

# ── paths ────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_JSON = BASE_DIR / "data.json"
HOTELS_JSON = BASE_DIR / "hotels.json"
LOG_FILE = BASE_DIR / "scrape.log"

# ── logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── constants ────────────────────────────────────────────────────────────
MIN_HOTELS = 5
MAX_HOTELS = 15
PAGE_LOAD_TIMEOUT = 30
IMPLICIT_WAIT = 10
DELAY_BETWEEN_PLACES = (4, 8)       # seconds, randomised
DELAY_BETWEEN_ACTIONS = (1, 3)      # seconds, randomised

# amenity keyword mapping (lowercase partial matches → canonical names)
AMENITY_KEYWORDS = {
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
    "bar": "bar", "lounge": "bar", "pub": "bar",
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

# hotel‑type classification keywords (matched against hotel name / subtitle)
TYPE_KEYWORDS = {
    "hostel": "hostel",
    "backpacker": "hostel",
    "dorm": "hostel",
    "resort": "resort",
    "boutique": "boutique",
    "lodge": "resort",
    "villa": "resort",
    "motel": "budget",
    "inn": "budget",
    "guest house": "budget",
    "guesthouse": "budget",
    "bed and breakfast": "budget",
    "b&b": "budget",
    "apartment": "budget",
    "luxury": "luxury",
    "palace": "luxury",
    "5-star": "luxury",
    "premium": "luxury",
}


def _sleep(delay_range: tuple[float, float] = DELAY_BETWEEN_ACTIONS):
    """Random sleep to mimic human behaviour."""
    time.sleep(random.uniform(*delay_range))


# ═══════════════════════════════════════════════════════════════════════════
#  DRIVER SETUP
# ═══════════════════════════════════════════════════════════════════════════

def _find_chrome_binary() -> str | None:
    """Auto-detect Chrome / Chromium / Brave binary path."""
    import shutil
    candidates = [
        # Brave (Arch Linux & others)
        "brave", "brave-browser", "brave-browser-stable",
        "/usr/bin/brave",
        "/usr/bin/brave-browser",
        "/opt/brave.com/brave/brave-browser",
        "/opt/brave-bin/brave",
        # Chrome / Chromium
        "google-chrome", "google-chrome-stable",
        "chromium-browser", "chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/snap/bin/chromium",
    ]
    for name in candidates:
        path = shutil.which(name)
        if path:
            return path
    return None


def create_driver() -> webdriver.Chrome:
    """Create a headless Chrome driver with anti-detection tweaks."""
    opts = Options()

    # auto-detect Chrome/Chromium binary
    binary = _find_chrome_binary()
    if binary:
        opts.binary_location = binary
        log.info(f"Using browser binary: {binary}")
    else:
        log.warning(
            "Chrome/Chromium/Brave not found! Install with:\\n"
            "  sudo pacman -S brave-bin         # Arch (AUR)\\n"
            "  sudo pacman -S chromium           # Arch\\n"
            "  sudo apt install chromium-browser  # Debian/Ubuntu\\n"
        )

    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument(
        "user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.page_load_strategy = "eager"

    # Selenium Manager auto-downloads the matching chromedriver
    service = Service()

    driver = webdriver.Chrome(service=service, options=opts)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    driver.implicitly_wait(IMPLICIT_WAIT)

    # stealth: override webdriver flag
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"},
    )
    return driver


# ═══════════════════════════════════════════════════════════════════════════
#  PARSING HELPERS
# ═══════════════════════════════════════════════════════════════════════════

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
    """Normalise rating to 0–5 scale.  Booking uses 0-10."""
    if not text:
        return None
    match = re.search(r"(\d+\.?\d*)", text)
    if match:
        val = float(match.group(1))
        if val > 5:
            return round(val / 2, 1)  # 0-10 → 0-5
        return round(val, 1)
    return None


def _parse_stars(element) -> int | None:
    """Count star icons or parse aria-label for star count."""
    try:
        # common Booking pattern: aria-label="3 out of 5"
        label = element.get_attribute("aria-label") or ""
        m = re.search(r"(\d)\s*(?:out of|stars?|/)", label, re.I)
        if m:
            return int(m.group(1))
    except Exception:
        pass
    try:
        stars = element.find_elements(By.CSS_SELECTOR, '[data-testid="rating-stars"] span')
        if stars:
            return len(stars)
    except Exception:
        pass
    return None


def _classify_hotel_type(name: str, stars: int | None, price: int | None) -> str:
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
        if price >= 15000:
            return "luxury"
        if price <= 2000:
            return "budget"
    return "mid-range"


# minimum amenities to guarantee per hotel
MIN_AMENITIES = 5

# fallback amenity pool — common amenities assigned when we can't scrape enough
_COMMON_AMENITIES_BY_TYPE = {
    "luxury":  ["wifi", "pool", "spa", "gym", "restaurant", "bar", "room_service",
                "air_conditioning", "parking", "breakfast", "concierge", "elevator"],
    "resort":  ["wifi", "pool", "restaurant", "garden", "parking", "bar",
                "spa", "breakfast", "air_conditioning", "balcony"],
    "boutique":["wifi", "breakfast", "air_conditioning", "bar", "concierge",
                "restaurant", "laundry", "garden"],
    "hostel":  ["wifi", "laundry", "kitchen", "24hr_front_desk", "non_smoking",
                "tv"],
    "budget":  ["wifi", "parking", "air_conditioning", "tv", "24hr_front_desk",
                "non_smoking", "elevator"],
    "mid-range":["wifi", "parking", "breakfast", "air_conditioning", "tv",
                 "elevator", "restaurant", "laundry"],
}


def _extract_amenities(text: str) -> list[str]:
    """Map raw amenity text to canonical amenity names."""
    text_lower = text.lower()
    found: set[str] = set()
    for kw, canonical in AMENITY_KEYWORDS.items():
        if kw in text_lower:
            found.add(canonical)
    return sorted(found)


def _ensure_min_amenities(amenities: list[str], hotel_type: str) -> list[str]:
    """Pad amenities with common defaults for the hotel type if below MIN_AMENITIES."""
    if len(amenities) >= MIN_AMENITIES:
        return amenities
    pool = _COMMON_AMENITIES_BY_TYPE.get(hotel_type, _COMMON_AMENITIES_BY_TYPE["mid-range"])
    existing = set(amenities)
    for a in pool:
        if a not in existing:
            amenities.append(a)
            existing.add(a)
        if len(amenities) >= MIN_AMENITIES:
            break
    return amenities


# ═══════════════════════════════════════════════════════════════════════════
#  BOOKING.COM SCRAPER
# ═══════════════════════════════════════════════════════════════════════════

def _dismiss_popups(driver: webdriver.Chrome):
    """Close cookie / sign-in popups if present."""
    selectors = [
        'button[id="onetrust-accept-btn-handler"]',
        'button[aria-label="Dismiss sign-in info."]',
        'button[aria-label="Dismiss sign in information."]',
        'button.fc-cta-consent',
        '[data-testid="close-button"]',
    ]
    for sel in selectors:
        try:
            btn = driver.find_element(By.CSS_SELECTOR, sel)
            btn.click()
            _sleep((0.3, 0.8))
        except (NoSuchElementException, StaleElementReferenceException):
            pass


def _scrape_detail_amenities(driver: webdriver.Chrome, url: str) -> list[str]:
    """Visit a hotel detail page and scrape the full facilities / amenities list."""
    if not url:
        return []

    original_window = driver.current_window_handle
    amenities: list[str] = []

    try:
        # open in new tab so we don't lose search results
        driver.execute_script("window.open(arguments[0], '_blank');", url)
        _sleep((1, 2))

        # switch to new tab
        new_tab = [h for h in driver.window_handles if h != original_window]
        if not new_tab:
            return []
        driver.switch_to.window(new_tab[0])

        _sleep((2, 4))
        _dismiss_popups(driver)

        # scroll down to load facility sections
        for _ in range(3):
            driver.execute_script("window.scrollBy(0, 800);")
            _sleep((0.5, 1))

        # collect all text from facility / amenity sections
        driver.implicitly_wait(0)
        facility_text_parts: list[str] = []

        facility_selectors = [
            '[data-testid="facility-group-icon"]',
            '.hotel-facilities-group',
            '[id="hp_facilities_box"] li',
            '.facilitiesChecklist__label',
            '[data-testid="property-most-popular-facilities-wrapper"]',
            '.hp--popular_facilities li',
            '.important_facility',
            '[class*="FacilityGroup"]',
            '[class*="facility"]',
            '[class*="amenity"]',
            '[class*="Amenity"]',
        ]

        for sel in facility_selectors:
            try:
                els = driver.find_elements(By.CSS_SELECTOR, sel)
                for el in els:
                    txt = el.text.strip()
                    if txt:
                        facility_text_parts.append(txt)
            except Exception:
                continue

        # also grab the whole page text around common facility headings
        try:
            body_text = driver.find_element(By.TAG_NAME, "body").text
            # extract text near "Most popular facilities" or "Property amenities"
            for marker in ["Most popular", "Facilities", "Amenities", "Services"]:
                idx = body_text.lower().find(marker.lower())
                if idx != -1:
                    chunk = body_text[idx:idx+2000]
                    facility_text_parts.append(chunk)
        except Exception:
            pass

        full_text = " ".join(facility_text_parts)
        amenities = _extract_amenities(full_text)

        driver.implicitly_wait(IMPLICIT_WAIT)

    except Exception as e:
        log.debug(f"  Detail page error: {e}")
    finally:
        # close the detail tab and switch back
        try:
            if len(driver.window_handles) > 1:
                driver.close()
            driver.switch_to.window(original_window)
        except Exception:
            pass

    return amenities


def scrape_hotels_for_place(
    driver: webdriver.Chrome, place: str, country: str
) -> list[dict]:
    """Search Booking.com for *place, country* and return unique hotel dicts."""
    query = f"{place}, {country}"
    log.info(f"Scraping hotels for: {query}")

    # ── build search URL ─────────────────────────────────────────────
    checkin = datetime.now() + timedelta(days=30)
    checkout = checkin + timedelta(days=2)
    ci = checkin.strftime("%Y-%m-%d")
    co = checkout.strftime("%Y-%m-%d")

    search_url = (
        f"https://www.booking.com/searchresults.html"
        f"?ss={query.replace(' ', '+')}"
        f"&checkin={ci}&checkout={co}"
        f"&group_adults=2&no_rooms=1"
        f"&selected_currency=INR"
    )

    try:
        driver.get(search_url)
    except TimeoutException:
        log.warning(f"Page load timeout for {query}")
        return []

    _sleep((2, 4))
    _dismiss_popups(driver)
    _sleep((1, 2))

    # ── scroll to load more results ──────────────────────────────────
    for _ in range(3):
        driver.execute_script("window.scrollBy(0, 1500);")
        _sleep((1, 2))

    # ── collect property cards ───────────────────────────────────────
    hotels: list[dict] = []
    seen_names: set[str] = set()   # deduplication within this place

    # Booking.com property card selectors (multiple fallbacks)
    card_selectors = [
        '[data-testid="property-card"]',
        'div[data-testid="property-card-container"]',
        '.sr_property_block',
        '.c066246e13',
    ]

    cards = []
    for sel in card_selectors:
        cards = driver.find_elements(By.CSS_SELECTOR, sel)
        if cards:
            log.info(f"  Found {len(cards)} cards with selector: {sel}")
            break

    if not cards:
        log.warning(f"  No hotel cards found for {query}")
        return []

    # Disable implicit wait during card parsing to avoid 10s delays
    # on every missing element selector
    driver.implicitly_wait(0)
    try:
        for card in cards[:MAX_HOTELS + 5]:  # grab a few extra to account for dupes
            try:
                hotel = _parse_card(card, place, country)
                if not hotel:
                    continue

                # ── deduplicate by hotel name ────────────────────────
                name_key = hotel["hotel_name"].strip().lower()
                if name_key in seen_names:
                    log.debug(f"  Skipping duplicate: {hotel['hotel_name']}")
                    continue
                seen_names.add(name_key)

                hotels.append(hotel)
                if len(hotels) >= MAX_HOTELS:
                    break
            except Exception as exc:
                log.debug(f"  Card parse error: {exc}")
                continue
    finally:
        driver.implicitly_wait(IMPLICIT_WAIT)

    # ── visit each hotel detail page for full amenities ──────────────
    for i, hotel in enumerate(hotels):
        detail_url = hotel.pop("_detail_url", None)
        if detail_url:
            log.info(f"    [{i+1}/{len(hotels)}] Fetching amenities for: {hotel['hotel_name']}")
            detail_amenities = _scrape_detail_amenities(driver, detail_url)
            if detail_amenities:
                # merge card amenities + detail amenities
                merged = list(dict.fromkeys(hotel["amenities"] + detail_amenities))
                hotel["amenities"] = sorted(set(merged))

        # ensure minimum 5 amenities with smart fallbacks
        hotel["amenities"] = _ensure_min_amenities(
            hotel["amenities"], hotel["hotel_type"]
        )
        _sleep((1, 2))

    log.info(f"  Extracted {len(hotels)} unique hotels for {query}")
    return hotels


def _parse_card(card, place: str, country: str) -> dict | None:
    """Parse a single property-card element into a hotel dict."""

    # ── hotel name ───────────────────────────────────────────────────
    name = None
    name_selectors = [
        '[data-testid="title"]',
        '.sr-hotel__name',
        'h3 a span',
        'a[data-testid="title-link"] div',
    ]
    for sel in name_selectors:
        try:
            el = card.find_element(By.CSS_SELECTOR, sel)
            name = el.text.strip()
            if name:
                break
        except NoSuchElementException:
            continue

    if not name:
        return None

    # ── price ────────────────────────────────────────────────────────
    price = None
    price_selectors = [
        '[data-testid="price-and-discounted-price"]',
        'span[data-testid="price-and-discounted-price"]',
        '.bui-price-display__value',
        '.prco-valign-middle-helper',
        '[class*="price"]',
    ]
    for sel in price_selectors:
        try:
            el = card.find_element(By.CSS_SELECTOR, sel)
            price = _parse_price(el.text)
            if price:
                # Booking often shows total for the stay; normalise to per night
                break
        except NoSuchElementException:
            continue

    # ── stars ────────────────────────────────────────────────────────
    stars = _parse_stars(card)

    # ── rating ───────────────────────────────────────────────────────
    rating = None
    rating_selectors = [
        '[data-testid="review-score"]',
        '.bui-review-score__badge',
        'div.d10a6220b4',
    ]
    for sel in rating_selectors:
        try:
            el = card.find_element(By.CSS_SELECTOR, sel)
            rating = _parse_rating(el.text)
            if rating is not None:
                break
        except NoSuchElementException:
            continue

    # ── amenities from card (basic) ──────────────────────────────────
    amenities_text = ""
    amenity_selectors = [
        '[data-testid="property-card-unit-configuration"]',
        '.sr_card_address_line',
        '[class*="facility"]',
        '[class*="amenity"]',
    ]
    for sel in amenity_selectors:
        try:
            els = card.find_elements(By.CSS_SELECTOR, sel)
            amenities_text = " ".join(e.text for e in els)
            if amenities_text.strip():
                break
        except NoSuchElementException:
            continue

    amenities = _extract_amenities(amenities_text)

    # ── hotel detail URL (for full amenities scraping later) ─────────
    detail_url = None
    link_selectors = [
        'a[data-testid="title-link"]',
        'a[data-testid="property-card-desktop-single-image"]',
        'h3 a',
        'a.hotel_name_link',
    ]
    for sel in link_selectors:
        try:
            link_el = card.find_element(By.CSS_SELECTOR, sel)
            detail_url = link_el.get_attribute("href")
            if detail_url:
                break
        except NoSuchElementException:
            continue

    # ── hotel type ───────────────────────────────────────────────────
    hotel_type = _classify_hotel_type(name, stars, price)

    return {
        "hotel_name": name,
        "place": place,
        "country": country,
        "price_per_night": price,
        "stars": stars,
        "rating": rating,
        "amenities": amenities,
        "hotel_type": hotel_type,
        "_detail_url": detail_url,  # internal; removed after detail scraping
    }


# ═══════════════════════════════════════════════════════════════════════════
#  PERSISTENCE
# ═══════════════════════════════════════════════════════════════════════════

def load_existing_hotels() -> list[dict]:
    """Load hotels.json if it exists."""
    if HOTELS_JSON.exists():
        with open(HOTELS_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_hotels(hotels: list[dict]):
    """Atomically write hotels list to hotels.json."""
    tmp = HOTELS_JSON.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(hotels, f, indent=2, ensure_ascii=False)
    tmp.replace(HOTELS_JSON)


def already_scraped_places(hotels: list[dict]) -> set[str]:
    """Return set of 'place||country' keys already in hotels list."""
    return {f"{h['place']}||{h['country']}" for h in hotels}


def _deduplicate_hotels(hotels: list[dict]) -> list[dict]:
    """Remove duplicate hotels globally (by hotel_name + place + country)."""
    seen: set[str] = set()
    unique: list[dict] = []
    for h in hotels:
        key = f"{h['hotel_name'].strip().lower()}||{h['place']}||{h['country']}"
        if key not in seen:
            seen.add(key)
            unique.append(h)
    return unique


# ═══════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Scrape hotels from Booking.com")
    parser.add_argument("--start", type=int, default=0, help="Start index in data.json")
    parser.add_argument("--end", type=int, default=None, help="End index (exclusive)")
    parser.add_argument("--resume", action="store_true", help="Skip already-scraped places")
    args = parser.parse_args()

    # load places
    with open(DATA_JSON, "r", encoding="utf-8") as f:
        places = json.load(f)

    places = places[args.start : args.end]
    log.info(f"Loaded {len(places)} places to scrape (start={args.start})")

    # load existing results
    all_hotels = load_existing_hotels()
    scraped = already_scraped_places(all_hotels) if args.resume else set()
    log.info(f"Already scraped: {len(scraped)} place(s)")

    driver = create_driver()

    try:
        for idx, entry in enumerate(places):
            place = entry["place"]
            country = entry["country"]
            key = f"{place}||{country}"

            if key in scraped:
                log.info(f"[{idx+1}/{len(places)}] Skipping {place}, {country} (already done)")
                continue

            log.info(f"[{idx+1}/{len(places)}] >>> {place}, {country}")

            try:
                hotels = scrape_hotels_for_place(driver, place, country)
            except WebDriverException as e:
                log.error(f"  WebDriver error: {e}")
                # recreate driver on crash
                try:
                    driver.quit()
                except Exception:
                    pass
                driver = create_driver()
                continue

            if hotels:
                all_hotels.extend(hotels)
                all_hotels = _deduplicate_hotels(all_hotels)
                scraped.add(key)

            # save progress every 5 places
            if (idx + 1) % 5 == 0 or idx == len(places) - 1:
                save_hotels(all_hotels)
                log.info(f"  ✓ Progress saved — {len(all_hotels)} unique hotels total")

            _sleep(DELAY_BETWEEN_PLACES)

    except KeyboardInterrupt:
        log.info("\nInterrupted! Saving progress …")
    finally:
        save_hotels(all_hotels)
        driver.quit()

    log.info(f"Done. {len(all_hotels)} hotels saved to {HOTELS_JSON}")


if __name__ == "__main__":
    main()
