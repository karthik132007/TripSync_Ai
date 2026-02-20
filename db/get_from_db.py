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
