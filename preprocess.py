# %%
import pandas as pd
import json
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler

import numpy as np
# %%
df = pd.read_json("data/data.json")
# %%
climate_mapping = {
    # Tropical group
    "Tropical": "Tropical",
    "Savanna": "Tropical",
    "Tropical highland": "Tropical",

    # Dry group
    "Desert": "Dry",
    "Desert coastal": "Dry",
    "Arid": "Dry",
    "Semi-arid": "Dry",
    "Highland desert": "Dry",

    # Temperate group
    "Temperate": "Temperate",
    "Moderate": "Temperate",
    "Oceanic": "Temperate",

    # Mediterranean
    "Mediterranean": "Mediterranean",

    # Subtropical group
    "Subtropical": "Subtropical",
    "Subtropical highland": "Subtropical",

    # Continental
    "Continental": "Continental",

    # Cold group
    "Cold": "Cold",
    "Subarctic": "Cold",
    "Subpolar": "Cold",

    # Alpine
    "Alpine": "Alpine",

    # Highland group
    "Highland": "Highland",
    "Montane": "Highland"
}

df['climate'] = df['climate'].map(climate_mapping)
# %%
df['popularity'] = df['popularity'].replace({
    "Emerging": "Offbeat",
    "Low": "Medium"
})
# %%
encode = OneHotEncoder(sparse_output=False)
pop_encoded = encode.fit_transform(df[['popularity']])
pop_df = pd.DataFrame(pop_encoded, columns=encode.get_feature_names_out(['popularity']))
df = pd.concat([df, pop_df], axis=1)
# %%
# Smart mapping: map each extra tag to its closest allowed tag(s)
tag_mapping = {
    # Adventure-related
    "4x4": ["adventure"],
    "bungee": ["adventure"],
    "cable-car": ["adventure"],
    "climbing": ["adventure", "trekking"],
    "helicopter": ["adventure"],
    "hot-air-balloon": ["adventure"],
    "balloons": ["adventure"],
    "quad-biking": ["adventure"],
    "road-trip": ["adventure"],
    "rock-climbing": ["adventure"],
    "sandboarding": ["adventure", "desert"],
    "self-drive": ["adventure"],
    "skydiving": ["adventure"],
    "sport": ["adventure"],
    "theme-parks": ["adventure"],
    "ziplining": ["adventure"],

    # Beach / ocean
    "coral-reefs": ["beach", "water-sports"],
    "harbour": ["beach", "boating"],
    "lagoon": ["beach"],
    "lagoons": ["beach"],
    "ocean": ["beach"],
    "overwater": ["beach", "luxury"],
    "pink-beach": ["beach"],
    "white-sand": ["beach"],

    # Water-sports
    "diving": ["water-sports"],
    "fishing": ["water-sports"],
    "kayaking": ["water-sports"],
    "kitesurfing": ["water-sports"],
    "snorkeling": ["water-sports"],
    "surfing": ["water-sports"],
    "tubing": ["water-sports"],

    # Boating
    "floating": ["boating"],
    "floating-villages": ["boating", "culture"],
    "mokoro-canoe": ["boating"],

    # Safari / wildlife
    "balloon-safaris": ["safari"],
    "black-rhino": ["safari"],
    "city-safari": ["safari"],
    "dolphins": ["nature", "water-sports"],
    "dragons": ["nature"],
    "elephants": ["safari"],
    "gorillas": ["safari"],
    "koalas": ["nature"],
    "marine-life": ["nature"],
    "migration": ["safari"],
    "rhinos": ["safari"],
    "savanna": ["safari"],
    "seals": ["nature"],
    "waterhole": ["safari", "nature"],
    "whale-sharks": ["nature", "water-sports"],
    "whale-watching": ["nature"],
    "wildlife": ["safari", "nature"],

    # Culture
    "K-pop": ["culture"],
    "aboriginal": ["culture"],
    "art": ["culture"],
    "festivals": ["culture"],
    "german-culture": ["culture"],
    "lanterns": ["culture"],
    "maori": ["culture"],
    "modern": ["culture"],
    "music": ["culture"],
    "opera": ["culture"],
    "skyscrapers": ["culture"],
    "street-art": ["culture"],
    "technology": ["culture"],

    # Food
    "beer": ["food"],
    "coffee": ["food"],
    "markets": ["food", "culture"],
    "night-market": ["food", "nightlife"],
    "pepper-farms": ["food"],
    "spice-tours": ["food"],
    "wine": ["food"],

    # History / heritage
    "architecture": ["heritage"],
    "bridge": ["heritage"],
    "colonial": ["history"],
    "forbidden-city": ["history", "heritage"],
    "great-wall": ["history", "heritage"],
    "lighthouse": ["heritage"],
    "museums": ["history"],
    "old-city": ["history"],
    "ruins": ["history"],
    "silk-road": ["history"],
    "towers": ["heritage"],
    "walled-city": ["history", "heritage"],

    # Spiritual
    "holy-sites": ["spiritual"],
    "mosques": ["spiritual"],
    "temples": ["spiritual"],

    # Nature
    "crater": ["nature"],
    "fjords": ["nature"],
    "gardens": ["nature"],
    "geothermal": ["nature"],
    "granite-boulders": ["nature"],
    "hot-springs": ["nature"],
    "mist": ["nature"],
    "rainbow": ["nature"],
    "rice-terraces": ["nature", "culture"],
    "rock": ["nature"],
    "scenic": ["nature"],
    "stargazing": ["nature"],
    "sunrise": ["nature"],
    "sunsets": ["nature", "romantic"],
    "volcanic": ["nature", "mountains"],
    "volcanoes": ["mountains", "nature"],

    # Forest
    "rainforest": ["forest"],

    # Desert
    "dunes": ["desert"],

    # Mountains / trekking
    "camel-treks": ["trekking", "desert"],
    "hiking": ["trekking"],
    "horse-trekking": ["trekking"],
    "summit": ["mountains", "trekking"],

    # Lakes (typos/plurals)
    "lake": ["lakes"],
    "lakeS": ["lakes"],
    "canyons": ["canyon"],

    # Luxury / wellness
    "duty-free": ["luxury"],
    "spa": ["luxury"],
    "wellness": ["luxury", "peaceful"],

    # Offbeat
    "hippie": ["offbeat"],
    "no-cars": ["offbeat"],
    "remote": ["offbeat"],
    "unique": ["offbeat"],
    "village": ["offbeat", "culture"],

    # Nightlife
    "party": ["nightlife"],
    "shopping": ["nightlife", "culture"],

    # Camping
    "yurts": ["camping"],

    # Drop (not meaningful destination tags)
    "family": [],
    "traffic": [],
    "windy": [],
}

with open("data/tags.json") as f:
    allowed_tags = set(json.load(f))

def clean_tags(tags_list):
    new_tags = []
    for tag in tags_list:
        if tag in allowed_tags:
            new_tags.append(tag)
        elif tag in tag_mapping:
            new_tags.extend(tag_mapping[tag])
        # else: drop unknown tag
    return list(dict.fromkeys(new_tags))  # deduplicate, preserve order

df['tags'] = df['tags'].apply(clean_tags)

# Verify no extra tags remain
all_tags_after = set()
for t in df['tags']:
    all_tags_after.update(t)
remaining_extra = all_tags_after - allowed_tags
print(f"Extra tags remaining: {remaining_extra if remaining_extra else 'None ✓'}")
print(f"Tags now used: {sorted(all_tags_after)}")
# %%
encode = MultiLabelBinarizer()
tags_encoded = encode.fit_transform(df['tags'])
tags_df = pd.DataFrame(tags_encoded,columns=encode.classes_)
df = pd.concat([df,tags_df],axis=1)
# %%
df= df.drop(columns="tags")
# %%
encode = MultiLabelBinarizer()
season_encoded = encode.fit_transform(df['season'])
season_df = pd.DataFrame(season_encoded,columns=encode.classes_)
df = pd.concat([df,season_df],axis=1)
# %%
df=df.drop(columns="season")
# %%
# Smart mapping for best_for: map extra values to allowed {solo, couple, family, friends}
role_mapping = {
    # Couple variants
    "couples": ["couple"],
    "honeymoon": ["couple"],
    "romantic": ["couple"],

    # Solo-leaning activities
    "spiritual": ["solo"],
    "photographers": ["solo", "friends"],
    "business": ["solo"],
    "wellness": ["solo", "couple"],
    "relaxation": ["solo", "couple"],
    "peaceful": ["solo", "couple"],

    # Friends-leaning activities
    "adventure": ["friends", "solo"],
    "thrill": ["friends"],
    "thrill-seekers": ["friends"],
    "hikers": ["friends", "solo"],
    "divers": ["friends"],
    "offbeat": ["friends", "solo"],
    "self-drive": ["friends", "couple"],
    "short-trip": ["friends", "couple", "family"],
    "boating": ["friends", "family"],
    "beach": ["friends", "couple", "family"],

    # Family-leaning
    "nature": ["family", "couple"],
    "wildlife": ["family", "friends"],
    "waterfalls": ["family", "friends"],

    # Culture / food / history → broad appeal
    "culture": ["solo", "couple", "friends"],
    "history": ["solo", "couple"],
    "history-buffs": ["solo", "friends"],
    "food": ["friends", "couple"],
    "food-lovers": ["friends", "couple"],
    "luxury": ["couple", "solo"],
}

allowed_roles = {"solo", "couple", "family", "friends"}

def clean_best_for(roles_list):
    if not isinstance(roles_list, list):
        return roles_list
    new_roles = []
    for role in roles_list:
        if role in allowed_roles:
            new_roles.append(role)
        elif role in role_mapping:
            new_roles.extend(role_mapping[role])
    return list(dict.fromkeys(new_roles))  # deduplicate, preserve order

df['best_for'] = df['best_for'].apply(clean_best_for)

# Verify
all_roles_after = set()
for r in df['best_for']:
    if isinstance(r, list):
        all_roles_after.update(r)
remaining = all_roles_after - allowed_roles
print(f"Extra roles remaining: {remaining if remaining else 'None ✓'}")
print(f"Roles now used: {sorted(all_roles_after)}")
# %%
encode = MultiLabelBinarizer()
role_encoded = encode.fit_transform(df['best_for'])
role_df = pd.DataFrame(role_encoded,columns=encode.classes_)
df = pd.concat([df,role_df],axis=1)
# %%
df = df.drop(columns="best_for")
# %%
total_cost = df['avg_cost_per_day']*df['trip_duration']
df['total_cost_log'] = np.log1p(total_cost)
# %%
# scaler = StandardScaler()
# df['total_cost_log'] = scaler.fit_transform(df[['total_cost_log']])
# df['avg_cost_per_day'] = scaler.fit_transform(df[['avg_cost_per_day']])
# df['trip_duration'] = scaler.fit_transform(df[['trip_duration']])
# %%
df= df.drop(columns="popularity")
# %%
country_to_region = {
    # South Asia
    "India": "South Asia",
    "Nepal": "South Asia",
    "Sri Lanka": "South Asia",
    "Maldives": "South Asia",
    "Bhutan": "South Asia",
    "Pakistan": "South Asia",
    "Bangladesh": "South Asia",

    # Southeast Asia (+ East Asia)
    "Cambodia": "Southeast Asia",
    "China": "Southeast Asia",
    "Indonesia": "Southeast Asia",
    "Japan": "Southeast Asia",
    "Laos": "Southeast Asia",
    "Malaysia": "Southeast Asia",
    "Myanmar": "Southeast Asia",
    "Philippines": "Southeast Asia",
    "Singapore": "Southeast Asia",
    "South Korea": "Southeast Asia",
    "Thailand": "Southeast Asia",
    "Vietnam": "Southeast Asia",
    "Taiwan": "Southeast Asia",
    "Mongolia": "Southeast Asia",
    "Brunei": "Southeast Asia",
    "Timor-Leste": "Southeast Asia",

    # Europe
    "Albania": "Europe",
    "Austria": "Europe",
    "Belgium": "Europe",
    "Bosnia and Herzegovina": "Europe",
    "Bulgaria": "Europe",
    "Croatia": "Europe",
    "Czech Republic": "Europe",
    "Denmark": "Europe",
    "Estonia": "Europe",
    "Finland": "Europe",
    "France": "Europe",
    "Georgia": "Europe",
    "Germany": "Europe",
    "Greece": "Europe",
    "Hungary": "Europe",
    "Iceland": "Europe",
    "Ireland": "Europe",
    "Italy": "Europe",
    "Latvia": "Europe",
    "Lithuania": "Europe",
    "Monaco": "Europe",
    "Montenegro": "Europe",
    "Netherlands": "Europe",
    "Norway": "Europe",
    "Poland": "Europe",
    "Portugal": "Europe",
    "Romania": "Europe",
    "Serbia": "Europe",
    "Slovenia": "Europe",
    "Spain": "Europe",
    "Sweden": "Europe",
    "Switzerland": "Europe",
    "United Kingdom": "Europe",
    "Slovakia": "Europe",
    "North Macedonia": "Europe",
    "Luxembourg": "Europe",
    "Malta": "Europe",
    "Andorra": "Europe",
    "San Marino": "Europe",
    "Cyprus": "Europe",
    "Russia": "Europe",

    # North America (+ Central America, Caribbean, South America)
    "Argentina": "North America",
    "Bahamas": "North America",
    "Belize": "North America",
    "Bolivia": "North America",
    "Brazil": "North America",
    "Canada": "North America",
    "Chile": "North America",
    "Colombia": "North America",
    "Costa Rica": "North America",
    "Cuba": "North America",
    "Dominican Republic": "North America",
    "Ecuador": "North America",
    "Guatemala": "North America",
    "Honduras": "North America",
    "Jamaica": "North America",
    "Mexico": "North America",
    "Nicaragua": "North America",
    "Panama": "North America",
    "Paraguay": "North America",
    "Peru": "North America",
    "Puerto Rico": "North America",
    "United States": "North America",
    "Uruguay": "North America",
    "El Salvador": "North America",
    "Aruba": "North America",
    "St. Lucia": "North America",
    "Barbados": "North America",
    "Turks & Caicos": "North America",
    "Cayman Islands": "North America",
    "Venezuela": "North America",
    "Guyana": "North America",
    "Suriname": "North America",
    "US Virgin Islands": "North America",
    "British Virgin Islands": "North America",
    "St. Martin / Sint Maarten": "North America",
    "St. Barthelemy": "North America",
    "Antigua & Barbuda": "North America",
    "Curacao": "North America",
    "Bonaire": "North America",
    "Grenada": "North America",

    # Middle East (+ Central Asia, North Africa)
    "Egypt": "Middle East",
    "Israel": "Middle East",
    "Jordan": "Middle East",
    "Kazakhstan": "Middle East",
    "Kyrgyzstan": "Middle East",
    "Morocco": "Middle East",
    "Tajikistan": "Middle East",
    "Turkey": "Middle East",
    "Turkmenistan": "Middle East",
    "UAE": "Middle East",
    "Uzbekistan": "Middle East",
    "Tunisia": "Middle East",
    "Algeria": "Middle East",
    "Mauritania": "Middle East",
    "Djibouti": "Middle East",
    "Armenia": "Middle East",
    "Azerbaijan": "Middle East",
    "Oman": "Middle East",
    "Qatar": "Middle East",
    "Saudi Arabia": "Middle East",
    "Lebanon": "Middle East",
    "Bahrain": "Middle East",
    "Kuwait": "Middle East",
    "Iran": "Middle East",
    "Iraq": "Middle East",

    # Africa
    "Botswana": "Africa",
    "Kenya": "Africa",
    "Mauritius": "Africa",
    "Namibia": "Africa",
    "Rwanda": "Africa",
    "Seychelles": "Africa",
    "South Africa": "Africa",
    "Tanzania": "Africa",
    "Uganda": "Africa",
    "Zambia/Zimbabwe": "Africa",
    "Madagascar": "Africa",
    "Mozambique": "Africa",
    "Zambia": "Africa",
    "Zimbabwe": "Africa",
    "Ethiopia": "Africa",
    "Malawi": "Africa",
    "Senegal": "Africa",
    "Cape Verde": "Africa",
    "Ghana": "Africa",
    "Nigeria": "Africa",
    "Reunion": "Africa",
    "Sao Tome and Principe": "Africa",
    "The Gambia": "Africa",
    "Ivory Coast": "Africa",
    "Togo": "Africa",
    "Benin": "Africa",
    "Cameroon": "Africa",
    "Angola": "Africa",
    "Lesotho": "Africa",
    "Eswatini": "Africa",
    "Eritrea": "Africa",
    "Gabon": "Africa",
    "Comoros": "Africa",
    "Guinea-Bissau": "Africa",
    "Guinea": "Africa",
    "Sierra Leone": "Africa",
    "Liberia": "Africa",
    "Equatorial Guinea": "Africa",
    "Republic of the Congo": "Africa",
    "DR Congo": "Africa",

    # Oceania
    "Australia": "Oceania",
    "Fiji": "Oceania",
    "French Polynesia": "Oceania",
    "New Zealand": "Oceania",
    "Cook Islands": "Oceania",
    "Samoa": "Oceania",
    "Vanuatu": "Oceania",
    "New Caledonia": "Oceania",
    "Tonga": "Oceania",
    "Palau": "Oceania",
    "Guam": "Oceania",
    "Papua New Guinea": "Oceania",
    "Solomon Islands": "Oceania",
    "Niue": "Oceania",
    "Micronesia": "Oceania",
    "Marshall Islands": "Oceania",
    "Northern Mariana Islands": "Oceania",
    "American Samoa": "Oceania",
    "Kiribati": "Oceania",
    "Tuvalu": "Oceania",
    "Nauru": "Oceania",
}

df['region'] = df['country'].map(country_to_region)

# Verify no unmapped countries
unmapped = df[df['region'].isna()]['country'].unique()
print(f"Unmapped countries: {list(unmapped) if len(unmapped) else 'None ✓'}")
print(f"\nRegion distribution:\n{df['region'].value_counts()}")

df = df.drop(columns="country")
# %%
encode = OneHotEncoder(sparse_output=False)
region_encoded = encode.fit_transform(df[['region']])
region_df = pd.DataFrame(region_encoded, columns=encode.get_feature_names_out(['region']))
df = pd.concat([df, region_df], axis=1)
# %%
df = df.drop(columns="region")
# %%
encode = OneHotEncoder(sparse_output=False)
climate_encoded = encode.fit_transform(df[['climate']])
climate_df = pd.DataFrame(climate_encoded, columns=encode.get_feature_names_out(['climate']))
df = pd.concat([df, climate_df], axis=1)
# %%
df = df.drop(columns="climate")
# %%

for col in df.columns:
    if df[col].dropna().isin([0, 1]).all():
        df[col] = df[col].astype('int64')

# %%
df['place'] =  df['place'].str.lower().str.strip()
# %%
df.to_csv("data/places_processed.csv")