from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "Scout backend running"}

@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/scan", methods=["POST"])
def scan():
    data = request.json
    address = data.get("address", "Unknown")

    return jsonify({
        "address": address,
        "building_score": 70,
        "risk_level": "moderate",
        "opportunity_level": "high"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
