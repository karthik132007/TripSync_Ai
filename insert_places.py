import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ── DB connection ────────────────────────────────────────────────────────────
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="travel_db",
    user="admin",
    password="root",
)
cur = conn.cursor()

# ── Load CSV ─────────────────────────────────────────────────────────────────
df = pd.read_csv("data/places_processed.csv")

# ── Rename CSV columns → DB column names ─────────────────────────────────────
rename_map = {
    "popularity_High":        "popularity_high",
    "popularity_Medium":      "popularity_medium",
    "popularity_Offbeat":     "popularity_offbeat",
    "popularity_Very High":   "popularity_very_high",
    "bird-watching":          "bird_watching",
    "water-sports":           "water_sports",
    "region_Africa":          "region_africa",
    "region_Europe":          "region_europe",
    "region_Middle East":     "region_middle_east",
    "region_North America":   "region_north_america",
    "region_Oceania":         "region_oceania",
    "region_South Asia":      "region_south_asia",
    "region_Southeast Asia":  "region_southeast_asia",
    "climate_Alpine":         "climate_alpine",
    "climate_Cold":           "climate_cold",
    "climate_Continental":    "climate_continental",
    "climate_Dry":            "climate_dry",
    "climate_Highland":       "climate_highland",
    "climate_Mediterranean":  "climate_mediterranean",
    "climate_Subtropical":    "climate_subtropical",
    "climate_Temperate":      "climate_temperate",
    "climate_Tropical":       "climate_tropical",
}
df.rename(columns=rename_map, inplace=True)

# ── Drop CSV index column (DB uses SERIAL) ────────────────────────────────────
df.drop(columns=["id"], inplace=True, errors="ignore")

# ── Add missing column that exists in DB but not in CSV ──────────────────────
if "region_nan" not in df.columns:
    df["region_nan"] = 0

# ── DB columns (exact order as in place_features, excluding serial id) ────────
db_columns = [
    "place", "avg_cost_per_day", "trip_duration",
    "popularity_high", "popularity_medium", "popularity_offbeat", "popularity_very_high",
    "adventure", "beach", "bird_watching", "boating", "camping", "canyon", "caves",
    "culture", "desert", "food", "forest", "heritage", "history", "islands", "lakes",
    "luxury", "mountains", "nature", "nightlife", "offbeat", "paragliding", "peaceful",
    "rafting", "river", "romantic", "safari", "skiing", "spiritual", "trekking",
    "water_sports", "waterfalls",
    "apr", "aug", "dec", "feb", "jan", "jul", "jun", "mar", "may", "nov", "oct", "sep",
    "couple", "family", "friends", "solo",
    "total_cost_log",
    "region_africa", "region_europe", "region_middle_east", "region_north_america",
    "region_oceania", "region_south_asia", "region_southeast_asia", "region_nan",
    "climate_alpine", "climate_cold", "climate_continental", "climate_dry",
    "climate_highland", "climate_mediterranean", "climate_subtropical",
    "climate_temperate", "climate_tropical", "climate_nan",
]

# ── Build list of tuples ──────────────────────────────────────────────────────
records = [tuple(row) for row in df[db_columns].itertuples(index=False, name=None)]

# ── Insert ────────────────────────────────────────────────────────────────────
cols_sql = ", ".join(db_columns)
insert_sql = f"INSERT INTO place_features ({cols_sql}) VALUES %s"

execute_values(cur, insert_sql, records, page_size=500)
conn.commit()

print(f"✓ Inserted {len(records)} rows into place_features")

cur.close()
conn.close()
