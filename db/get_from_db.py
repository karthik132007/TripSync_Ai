import psycopg2
import pandas as pd
from dotenv import load_dotenv
import os
load_dotenv()
conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        port=os.getenv("DB_PORT")
    )
cur = conn.cursor()

def get_hotels():
    try:
        rows=cur.execute("select * from hotels;")
        rows = cur.fetchall()
        rows = pd.DataFrame(rows)
        return rows
    except Exception as e:
        print(e)
        conn.rollback()

def get_places():

    try:
        rows=cur.execute("select * from places;")
        rows = cur.fetchall()
        rows = pd.DataFrame(rows)
        return rows
    except Exception as e:
        print(e)
        conn.rollback()

def get_place_id(place_name):
    try:
        cur.execute(
            "select id from places where trim(lower(place)) = trim(lower(%s))",
            (place_name,),
        )
        row = cur.fetchone()
        place_id = row[0] if row else None
    except Exception as e:
        print(e)
        conn.rollback()
    return place_id
def get_with_place_id(id_list):
    places =[]
    for i in id_list:
        try:
            cur.execute("select place from places where id = %s", (int(i),))
            row = cur.fetchone()
            if row:
                places.append(row[0])
        except Exception as e:
            print("Error fetching place ID:", i, e)
            conn.rollback()
    return places
# def get_hotel_id(hotel_name):
#     try:
#         cur.execute("select id from hotels where hotel_name = %s", (hotel_name,))
#         Id = cur.fetchone()
#     except Exception as e:
#         print(e)
#         conn.rollback()
#     return Id