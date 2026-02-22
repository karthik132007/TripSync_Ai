from fastapi import FastAPI
from pref_model import Preferences
app = FastAPI()

@app.post("/plan")
def get_user_prefrences(prefrences : Preferences):
    return {
        "message":"got it broo",
        "data" : prefrences
    }