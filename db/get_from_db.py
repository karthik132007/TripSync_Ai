import psycopg2
import pandas as pd
from dotenv import load_dotenv
import os

load_dotenv()

DB_URL = os.getenv("DB_URL")


def get_connection():
    return psycopg2.connect(DB_URL)


def get_hotels():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("select * from hotels;")
        rows = cur.fetchall()

        rows = pd.DataFrame(rows)

        cur.close()
        conn.close()

        return rows

    except Exception as e:
        print(e)
        return None


def get_places():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("select * from places;")
        rows = cur.fetchall()

        rows = pd.DataFrame(rows)

        cur.close()
        conn.close()

        return rows

    except Exception as e:
        print(e)
        return None


def get_place_id(place_name):
    place_id = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "select id from places where lower(place) like lower(%s) limit 1",
            (f"%{place_name}%",),
        )

        row = cur.fetchone()

        if row:
            place_id = row[0]

        cur.close()
        conn.close()

    except Exception as e:
        print(e)

    return place_id


def get_with_place_id(id_list):
    places = []

    try:
        conn = get_connection()
        cur = conn.cursor()

        for i in id_list:
            cur.execute(
                "select place from places where id = %s",
                (int(i),),
            )

            row = cur.fetchone()

            if row:
                places.append(row[0])

        cur.close()
        conn.close()

    except Exception as e:
        print("Error fetching place ID:", e)

    return places


# def get_hotel_id(hotel_name):
#     try:
#         conn = get_connection()
#         cur = conn.cursor()
#
#         cur.execute(
#             "select id from hotels where hotel_name = %s",
#             (hotel_name,)
#         )
#
#         Id = cur.fetchone()
#
#         cur.close()
#         conn.close()
#
#     except Exception as e:
#         print(e)
#
#     return Id