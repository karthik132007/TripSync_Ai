from pathlib import Path
from flask import Flask, request, jsonify
from recommender.core import load_dataset, travel_recommend
import random

app = Flask(__name__)

# ------------------ LOAD DATASET ------------------
def _dataset_path() -> str:
    return str(Path(__file__).resolve().parent.parent / "data" / "dataset.json")

places = load_dataset("data/dataset.json")

# ---------- IN-MEMORY GROUP STORAGE ----------
groups = {}
# structure:
# {
#   "TS-1234": {
#       "members": [
#          {"name": "...", "type": "...", "interests": [...], "budget": "..."},
#          {...}
#       ]
#   }
# }

# ------------------ CORS FIX ------------------
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    return response


# ------------------ CREATE GROUP ------------------
@app.route("/create_group", methods=["GET"])
def create_group():
    gid = f"TS-{random.randint(1000, 9999)}"
    groups[gid] = {"members": []}
    return jsonify({"group_id": gid})


# ---------- JOIN GROUP ----------
@app.route("/join_group", methods=["POST"])
def join_group():
    data = request.json

    group_id = data.get("group_id")
    if not group_id or group_id not in groups:
        return jsonify({"error": "Invalid Group ID"}), 400

    user_name = data.get("user_name", "Anonymous")
    
    # Check if user already exists in group (prevent duplicates)
    existing_members = groups[group_id]["members"]
    for i, member in enumerate(existing_members):
        if member.get("name") == user_name:
            # User already in group, UPDATE their preferences
            existing_members[i] = {
                "name": user_name,
                "type": data.get("user_type"),
                "interests": data.get("user_interests"),
                "budget": data.get("user_budget")
            }
            return jsonify({
                "success": True,
                "members": existing_members,
                "updated": True
            })
    
    # Add new user to group
    user = {
        "name": user_name,
        "type": data.get("user_type"),
        "interests": data.get("user_interests"),
        "budget": data.get("user_budget")
    }

    groups[group_id]["members"].append(user)

    return jsonify({
        "success": True,
        "members": groups[group_id]["members"],
        "already_joined": False
    })


# ---------- VERIFY GROUP (CHECK IF EXISTS) ----------
@app.route("/verify_group", methods=["POST"])
def verify_group():
    data = request.json
    group_id = data.get("group_id")

    if not group_id or group_id not in groups:
        return jsonify({"success": False, "error": "Invalid Group ID"}), 400

    return jsonify({
        "success": True,
        "group_id": group_id,
        "member_count": len(groups[group_id]["members"])
    })


# ---------- GET GROUP MEMBERS ----------
@app.route("/get_group_members", methods=["POST"])
def get_group_members():
    data = request.json
    group_id = data.get("group_id")

    if not group_id or group_id not in groups:
        return jsonify({"error": "Invalid Group ID"}), 400

    group_data = groups[group_id]
    
    # Return members AND the results (if they exist)
    return jsonify({
        "success": True,
        "members": group_data["members"],
        "trip_results": group_data.get("results", []) 
    })


# ---------- GENERATE GROUP TRIP ----------
@app.route("/generate_group_trip", methods=["POST"])
def generate_group_trip():
    data = request.json
    group_id = data.get("group_id")

    if not group_id or group_id not in groups:
        return jsonify({"error": "Invalid Group ID"}), 400

    # If results already exist, return them (Idempotency)
    # This ensures if User B clicks generate after User A, they get the same trip.
    if groups[group_id].get("results"):
        return jsonify(groups[group_id]["results"])

    members = groups[group_id]["members"]

    # Combine interests (list of lists)
    group_interests = [m["interests"] for m in members]

    # Pick majority budget
    budgets = [m["budget"] for m in members]
    group_budget = max(set(budgets), key=budgets.count) if budgets else "mid"

    group_type = "friends"

    results = travel_recommend(
        user_type=group_type,
        user_interests=group_interests,
        user_budget=group_budget,
        places=places,
        top_n=10
    )

    # SAVE the results to the group object
    groups[group_id]["results"] = results

    return jsonify(results)


# ------------------ SINGLE-USER RECOMMEND ------------------
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json

    user_type = data.get("user_type")
    user_interests = data.get("user_interests")
    user_budget = data.get("user_budget")

    results = travel_recommend(
        user_type=user_type,
        user_interests=user_interests,
        user_budget=user_budget,
        places=places,
        top_n=10
    )

    return jsonify(results)


# ------------------ HEALTH CHECK ------------------
@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok", "items_loaded": len(places), "groups": len(groups)}


if __name__ == "__main__":
    app.run(debug=True)
