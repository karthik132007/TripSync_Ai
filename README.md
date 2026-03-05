# TripSync AI

**Intelligent travel recommendation system powered by a two-tower neural retrieval architecture, neural reranking, and LLM-based itinerary generation.**

TripSync AI ingests structured destination and hotel data from around the world, encodes user travel preferences into dense embedding vectors, and performs two-stage neural retrieval to surface personalized destination recommendations. A secondary rule-based scoring engine handles hotel matching, while an LLM pipeline generates day-by-day trip itineraries from selected destinations.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Recommendation Engine](#recommendation-engine)
  - [Feature Encoding](#feature-encoding)
  - [User Tower](#user-tower)
  - [Two-Stage Retrieval and Reranking](#two-stage-retrieval-and-reranking)
  - [Similar Places Engine](#similar-places-engine)
  - [Hotel Scoring](#hotel-scoring)
- [Data Pipeline](#data-pipeline)
  - [Place Preprocessing](#place-preprocessing)
  - [Hotel Preprocessing](#hotel-preprocessing)
  - [Database Ingestion](#database-ingestion)
- [Backend API](#backend-api)
- [Frontend Application](#frontend-application)
- [LLM Integration](#llm-integration)
- [Image Resolution Layer](#image-resolution-layer)
- [Infrastructure](#infrastructure)
- [Tech Stack](#tech-stack)

---

## System Architecture

```
                                     +------------------+
                                     |   React Client   |
                                     |  (Vite + Router) |
                                     +--------+---------+
                                              |
                                         HTTP / JSON
                                              |
                                     +--------v---------+
                                     |   FastAPI Server  |
                                     |   (Uvicorn)       |
                                     +----+---------+----+
                                          |         |
                          +---------------+         +----------------+
                          |                                          |
                +---------v----------+                    +----------v----------+
                | Recommendation     |                    | LLM Service         |
                | Engine             |                    | (OpenRouter API)    |
                |                    |                    +---------------------+
                | - User Tower (TF)  |
                | - Reranker (TF)    |
                | - Cosine Retrieval |
                | - Hotel Scorer     |
                +----+----------+----+
                     |          |
          +----------+          +-----------+
          |                                 |
+---------v--------+             +----------v----------+
|  PostgreSQL 16   |             |  Static Data Files  |
|  (Docker)        |             |  (JSON / CSV / NPY) |
+------------------+             +---------------------+
```

The system follows a layered architecture:

1. **Presentation Layer** -- React SPA handling multi-step preference collection and result rendering.
2. **API Layer** -- FastAPI server exposing RESTful endpoints for recommendations, place details, itinerary generation, and hotel matching.
3. **Intelligence Layer** -- TensorFlow-based user tower and reranker models, cosine similarity retrieval, and rule-based hotel scoring.
4. **Data Layer** -- PostgreSQL for structured feature storage, JSON files for rich metadata, and NumPy arrays for pre-computed item embeddings.

---

## Recommendation Engine

### Feature Encoding

User preferences are encoded into a **71-dimensional dense feature vector** via deterministic mapping in `engine/change_shape.py`:

| Feature Group        | Dimensions | Encoding         | Description                                        |
|----------------------|------------|------------------|----------------------------------------------------|
| `avg_cost_per_day`   | 1          | Scalar (clipped) | Budget / duration, clipped to [800, 12000]         |
| `trip_duration`      | 1          | Scalar (clipped) | Number of days, clipped to [1, 12]                 |
| Popularity           | 4          | One-hot          | high, medium, offbeat, very_high                   |
| Activity tags        | 31         | Multi-hot        | 31 canonical tags (adventure through waterfalls)    |
| Travel months        | 12         | Multi-hot        | Calendar months                                    |
| Travel type          | 4          | One-hot          | solo, couple, family, friends                      |
| `total_cost_log`     | 1          | Scalar (clipped) | log1p(budget), clipped to [6.7, 11.9]              |
| Region               | 7          | One-hot          | Reserved; zeroed during inference                  |
| Climate              | 10         | Multi-hot        | alpine, cold, continental, dry, highland, etc.     |

The vector is zero-padded to 72 dimensions before being passed to the user tower to match the model's input shape.

### User Tower

The user tower is a feedforward neural network implemented in TensorFlow/Keras (`engine/user_tower.py`):

```
Input (72D) --> Normalization --> Dense(128, ReLU) --> Dropout(0.2) --> Dense(64) --> Output (64D)
```

- The normalization layer uses pre-computed mean and variance statistics loaded from `engine/norm_weights.npz`.
- The output is a **64-dimensional user embedding** in the same latent space as the pre-computed item embeddings.
- The model is loaded lazily as a singleton to avoid redundant initialization across requests.

Item embeddings are pre-computed offline and stored as a NumPy array (`engine/item_embeddings.npy`) of shape `(N, 64)`, where N is the number of indexed destinations.

### Two-Stage Retrieval and Reranking

The recommendation pipeline (`engine/recommendations.py`) operates in two stages:

**Stage 1 -- Retrieval:**
- Compute cosine similarity between the 64D user embedding and all N item embeddings.
- Apply a **month penalty** of -0.1 for places whose supported months do not overlap with the user's selected months.
- Apply a **tag boost** of +0.3 for each matching activity tag.
- Select the top 100 candidates.

**Stage 2 -- Neural Reranking:**
- For each candidate, construct a 256D interaction feature vector: `[user_emb | item_emb | |user - item| | user * item]`.
- Pass through a trained Keras reranker model (`engine/reranker_model.keras`).
- Add stochastic noise for tie-breaking.
- Select the top 20 results. Confidence scores are linearly normalized to the [85%, 98%] range.

This two-stage approach balances retrieval breadth (cosine over full corpus) with ranking precision (learned interaction features on a shortlist).

### Similar Places Engine

The `SimilarPlaces` class (`engine/cluster.py`) provides content-based similarity for "related destinations" queries:

- All place feature vectors are loaded from PostgreSQL and numerically scaled via `StandardScaler`.
- A full pairwise cosine similarity matrix is pre-computed at initialization.
- Given a clicked place, the engine returns the top 10 most similar places by cosine score.
- The engine is instantiated as a lazy singleton to amortize the cost of matrix computation.

### Hotel Scoring

Hotel recommendations (`engine/hotel.py`) use a **rule-based weighted scoring model**:

1. **Hard filtering:** Exclude hotels exceeding the user's max price, below the minimum rating, or beyond the maximum distance from downtown.
2. **Soft scoring** (weighted linear combination):
   - Amenity match: 40%
   - Price competitiveness (lower is better): 30%
   - Rating (higher is better): 20%
   - Proximity to downtown (closer is better): 10%
3. Return the top 5 hotels sorted by composite score.

---

## Data Pipeline

### Place Preprocessing

The preprocessing pipeline (`preprocess.py`) transforms raw destination JSON into a model-ready feature matrix:

1. **Climate normalization** -- 20+ raw climate labels are mapped to 9 canonical categories (Tropical, Dry, Temperate, Mediterranean, Subtropical, Continental, Cold, Alpine, Highland).
2. **Popularity normalization** -- Emerging is mapped to Offbeat, Low to Medium. One-hot encoded.
3. **Tag cleaning** -- 100+ raw activity tags are mapped to 31 canonical tags using a curated mapping dictionary. Multi-label binarized.
4. **Season encoding** -- Travel months multi-label binarized.
5. **Travel type normalization** -- 20+ role labels (honeymoon, photographers, hikers, etc.) are collapsed to 4 canonical types (solo, couple, family, friends). Multi-label binarized.
6. **Cost transformation** -- `log1p(avg_cost_per_day * trip_duration)` for log-normal distribution alignment.
7. **Region mapping** -- 180+ countries mapped to 7 macro-regions (South Asia, Southeast Asia, Europe, North America, Middle East, Africa, Oceania). One-hot encoded.
8. **Climate encoding** -- One-hot encoded from the normalized climate labels.

Output: `data/places_processed.csv` -- a fully flattened numeric feature matrix.

### Hotel Preprocessing

The hotel data pipeline consists of three stages:

1. **Scraping** (`data/scrape_hotels.py`) -- Asynchronous scraper using `httpx` with HTTP/2 support and `curl_cffi` for TLS fingerprint impersonation. Features rotating user-agents, exponential backoff with jitter, concurrency limiting, incremental save with resume support, and optional Playwright fallback for JavaScript-rendered pages. Amenities are normalized via a 60+ keyword mapping, and hotel types are classified into six categories (hostel, resort, boutique, budget, luxury, mid-range).

2. **Processing** (`data/process_hotels.py`) -- Restructures scraped hotel data into a flat list with assigned `hotel_id` and `place_id` references linked to the places feature matrix.

3. **Feature engineering** (`preprocess_hotel.py`) -- Fills missing `distance_from_downtown_km` using type-based heuristics (resort/luxury: 8-20 km, others: 0.5-5 km), imputes missing prices with median and ratings with mean, multi-label binarizes amenities, and one-hot encodes hotel types. Output: `data/hotels_preprocessed.csv`.

### Database Ingestion

- `insert_places.py` -- Loads `places_processed.csv`, aligns column names to the PostgreSQL schema, and performs bulk insertion via `psycopg2.extras.execute_values()`.
- `insert_hotels.py` -- Loads `hotels_preprocessed.csv`, adjusts 0-based to 1-based `place_id` indexing, and bulk inserts.

**PostgreSQL Schema** (`init_db.sql`):

- **`places`** -- 75 columns: `id` (serial PK), `place` (text), 2 continuous features, 4 popularity flags, 31 tag flags, 12 month flags, 4 travel-type flags, 1 log-cost scalar, 8 region flags, 10 climate flags. All flags stored as `SMALLINT`.
- **`hotels`** -- 28 columns: `id` (serial PK), `place_id` (FK to places), hotel metadata (name, price, rating, distance, link), 16 amenity flags, 6 hotel-type flags.

---

## Backend API

The backend is a FastAPI application (`backend/app.py`) served via Uvicorn on port 8000 with CORS middleware.

### Endpoints

| Method | Path                        | Description                                                                 |
|--------|-----------------------------|-----------------------------------------------------------------------------|
| POST   | `/plan`                     | Accepts user preferences, generates user embedding, runs two-stage retrieval, returns up to 12 deduplicated destination recommendations with confidence scores and images. |
| GET    | `/places/{place_id}`        | Returns full place metadata from JSON storage with up to 3 resolved images. |
| GET    | `/places/{place_id}/related`| Returns top 10 similar destinations via the cosine similarity matrix.       |
| POST   | `/places/{place_id}/plan`   | Accepts trip parameters, invokes LLM to generate a structured day-by-day itinerary in JSON format. |
| POST   | `/places/{place_id}/hotels` | Accepts hotel preferences (amenities, price, rating, distance), returns top 5 scored hotels. |

### Request Validation

Pydantic models (`backend/pref_model.py`) enforce input constraints:

- **`Preferences`** -- Validates budget > 0, duration > 0, and a minimum daily spend of 15 (budget/duration).
- **`HotelPreferences`** -- Typed amenity list with numeric bounds for price, rating, and distance.
- **`PlanRequest`** -- Duration, place name, travel type, budget, and tag string for LLM prompt construction.

---

## Frontend Application

React 19 SPA built with Vite and Tailwind CSS 4.

### Routing

| Route               | Component      | Purpose                                    |
|----------------------|----------------|--------------------------------------------|
| `/`                  | `LandingPage`  | Marketing page with feature sections       |
| `/plan`              | `PlanTrip`     | 7-step preference collection wizard        |
| `/recommend`         | `Recommend`    | Recommendation results grid                |
| `/places/:id`        | `PlaceInfo`    | Destination detail with hotels and related  |
| `/places/:id/plan`   | `TripPlan`     | LLM-generated itinerary viewer             |

### Key Interfaces

- **PlanTrip** -- 7-step scroll-reveal form (months, budget, duration, travel type, climate, tags, popularity). Posts to `/plan`, caches in `localStorage`, passes results via Router state.
- **Recommend** -- Responsive 1-4 column grid with rank badges, confidence scores, and intersection-observer entrance animations.
- **PlaceInfo** -- Destination detail with hero banner, embedded trip planner form, hotel recommendation modal, and related destinations grid.
- **TripPlan** -- Renders LLM-generated JSON itineraries as a day-by-day timeline with expense breakdown and downloadable export.

---

## LLM Integration

Itinerary generation (`ask_gpt.py`) uses the OpenRouter API with model `stepfun/step-3.5-flash:free` via the OpenAI Python SDK. A system prompt enforces strict JSON schema output containing: day-by-day itinerary (morning/afternoon/evening), expense breakdown, must-try food, must-visit places, and travel tips. Temperature set to 0.7.

---

## Image Resolution Layer

| Source              | Strategy                                                                |
|---------------------|-------------------------------------------------------------------------|
| Unsplash API (primary) | Landscape-oriented, content-filtered photos with tag-enhanced queries |
| Wikimedia Commons (fallback) | Dimension filtering (min 1000x600), aspect ratio validation, non-photo blacklist |

Both sources feed through per-request URL deduplication and a two-tier cache (in-memory + `data/image_cache.json`).

---

## Infrastructure

| Component        | Technology          | Configuration                             |
|------------------|---------------------|-------------------------------------------|
| Database         | PostgreSQL 16       | Dockerized via Compose, persistent volume  |
| Backend Server   | Uvicorn + FastAPI   | Port 8000, CORS wildcard origins           |
| Frontend Dev     | Vite 8.0-beta       | Hot module replacement, API proxy          |
| LLM Provider     | OpenRouter API      | StepFun Step-3.5 Flash model               |
| Image APIs       | Unsplash, Wikimedia | Dual-source with file-backed caching       |
| Containerization | Docker Compose      | Single PostgreSQL service                  |

---

## Tech Stack

**Backend:**
Python -- FastAPI -- Uvicorn -- TensorFlow/Keras -- NumPy -- scikit-learn -- pandas -- psycopg2 -- OpenAI SDK

**Frontend:**
React 19 -- Vite -- Tailwind CSS 4 -- React Router DOM 7 -- Lucide React -- react-markdown -- rehype-raw -- remark-gfm

**Data and ML:**
Two-tower neural retrieval -- Keras reranker -- cosine similarity -- StandardScaler -- MultiLabelBinarizer -- OneHotEncoder

**Infrastructure:**
PostgreSQL 16 (Docker) -- OpenRouter API -- Unsplash API -- Wikimedia Commons API