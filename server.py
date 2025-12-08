from flask import Flask, request, jsonify
from recommender.core import load_dataset, travel_recommend

app = Flask(__name__)

places = load_dataset("data/dataset.json")

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json

    user_type = data.get("user_type")
    user_interests = data.get("user_interests")   # list OR list of lists
    user_budget = data.get("user_budget")

    results = travel_recommend(
        user_type=user_type,
        user_interests=user_interests,
        user_budget=user_budget,
        places=places,
        top_n=10
    )

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
