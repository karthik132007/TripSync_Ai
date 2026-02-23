import sys, os
sys.path.insert(0, os.path.abspath('..'))

from fastapi import FastAPI
from pref_model import Preferences
from engine.cluster import *
from db.get_from_db import *
app = FastAPI()

@app.post("/plan")
def get_user_prefrences(prefrences : Preferences):
    return {
        "message":"got it broo",
        "data" : prefrences
    }
@app.get("/recommend")
def show_recomendations():
    pass

@app.post("/recommend")
def get_clicked_place(place_name):
    get_place_id(place_name=place_name)