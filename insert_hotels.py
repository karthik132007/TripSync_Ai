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
df = pd.read_csv("data/hotels_preprocessed.csv")

# ── Drop CSV index column (DB uses SERIAL) ────────────────────────────────────
df.drop(columns=["hotel_id"], inplace=True, errors="ignore")

# ── CSV place_id is 0-based; place_features.id is 1-based ────────────────────
df["place_id"] = df["place_id"] + 1

# ── Rename columns to match DB schema ────────────────────────────────────────
df.rename(columns={
    "24hr_front_desk":    "front_desk_24hr",
    "hotel_type_mid-range": "hotel_type_mid_range",
}, inplace=True)

# ── DB columns (exact order, excluding serial id) ─────────────────────────────
db_columns = [
    "place_id", "hotel_name",
    "price_per_night", "rating", "distance_from_downtown_km", "hotel_link",
    "front_desk_24hr", "air_conditioning", "bar", "breakfast", "concierge",
    "garden", "gym", "kitchen", "laundry", "non_smoking", "parking", "pool",
    "restaurant", "spa", "tv", "wifi",
    "hotel_type_boutique", "hotel_type_budget", "hotel_type_hostel",
    "hotel_type_luxury", "hotel_type_mid_range", "hotel_type_resort",
]

records = [tuple(row) for row in df[db_columns].itertuples(index=False, name=None)]

# ── Insert ────────────────────────────────────────────────────────────────────
cols_sql = ", ".join(db_columns)
insert_sql = f"INSERT INTO hotel_features ({cols_sql}) VALUES %s"

execute_values(cur, insert_sql, records, page_size=500)
conn.commit()

print(f"✓ Inserted {len(records)} rows into hotel_features")

cur.close()
conn.close()
