# %%
import pandas as pd
import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler

# %%
df = pd.read_json("data/hotels_processed.json")
# %%
df= df.drop(columns="place_name")
# %%
def fill_distance(row):
    if pd.isna(row['distance_from_downtown_km']):
        if row['hotel_type'] in ['resort', 'luxury']:
            return np.random.uniform(8,20)
        else:
            return np.random.uniform(0.5,5)
    return row['distance_from_downtown_km']

# %%
df['distance_from_downtown_km'] = df.apply(fill_distance,axis=1)
# %%
df['price_per_night'] = df['price_per_night'].fillna(df['price_per_night'].median())
# %%
df = df.drop(columns=['stars'])
# %%
df['rating'] = df['rating'].fillna(df['rating'].mean())
# %%
encode = MultiLabelBinarizer()
tags = encode.fit_transform(df['amenities'])
tag_df=pd.DataFrame(tags,columns=encode.classes_)
df=pd.concat([df,tag_df],axis=1)
# %%
encode = OneHotEncoder(sparse_output=False)
typ = encode.fit_transform(df[['hotel_type']])
typ_df = pd.DataFrame(typ,columns=encode.get_feature_names_out(['hotel_type']))
df = pd.concat([df,typ_df],axis=1)
# %%
df= df.drop(columns=["hotel_type","amenities"])
# %%
df = df.set_index('hotel_id')
# %%

for col in df.columns:
    if df[col].dropna().isin([0, 1]).all():
        df[col] = df[col].astype('int64')

# %%
df.to_csv("data/hotels_preprocessed.csv",index=True)