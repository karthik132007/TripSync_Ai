from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("API_KEY")


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY
)

def ask_llm(preferences: dict):

    prompt = (
        f"Create a {preferences['duration']} day trip plan to {preferences['place']} "
        f"for {preferences['best_for']}. "
        f"Start from when the traveler reaches {preferences['place']}. "
        f"Budget: INR {preferences['budget']}. "
        f"Travel style: {preferences['tags']}."
    )

    completion = client.chat.completions.create(
        model="stepfun/step-3.5-flash:free",
        messages=[
            {
  "role": "system",
  "content": """
You are an expert travel planner.

Return output in clean Json ONLY. Do NOT wrap it in markdown block quotes like ```json.

You must follow this exact JSON schema:
{
  "itinerary": [
    {
      "day": 1,
      "morning": ["activity 1", "activity 2"],
      "afternoon": ["activity 1", "activity 2"],
      "evening": ["activity 1", "activity 2"]
    }
  ],
  "estimated_expense_breakdown": {
    "Stay": 20000,
    "Food": 10000,
    "Transport": 5000,
    "Activities": 10000,
    "Miscellaneous": 5000
  },
  "must_try_food": ["food 1", "food 2"],
  "must_visit_places": ["place 1", "place 2"],
  "tips_and_additional_info": ["tip 1", "tip 2"]
}

Rules for values:
- Use bullet points (short phrases, max 15 words) for arrays.
- Add emojis where suitable.
- Ensure the total of `estimated_expense_breakdown` matches the budget.
- Do not add explanations outside the json object.
"""
},
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7
        
    )

    return completion.choices[0].message.content