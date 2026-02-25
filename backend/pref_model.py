from pydantic import BaseModel, model_validator

class Preferences(BaseModel):
    month : list
    budget : int
    duration : int
    best_for : str
    weather : list
    tags : list
    popular: str

    @model_validator(mode='after')
    def check_realistic_combination(self):
        if self.budget <= 0:
            raise ValueError("Budget must be greater than 0.")
        if self.duration <= 0:
            raise ValueError("Duration must be greater than 0.")
        if (self.budget / self.duration) < 15:
            # $15 per day is a minimal realistic check
            raise ValueError("Budget is too low for this duration. Please allow at least $15 per day.")
        return self