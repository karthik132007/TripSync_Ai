from pydantic import BaseModel

class Preferences(BaseModel):
    month : list
    budget : int
    duration : int
    best_for : str
    weather : list
    tags : list
    popular: str