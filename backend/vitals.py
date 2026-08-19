import os
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

vitals = Flask(__name__)

# Production Security: Pulls your live Netlify URL from Render environment variables
# Falls back to your local Vite server for development testing
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://netlify.app")
CORS(vitals, origins=["http://localhost:5173", FRONTEND_URL])

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_ENDPOINT = "https://groq.com"

SYSTEM_PROMPT = """You are Vitals AI, a knowledgeable health assistant built into the Vitals app. You know about symptoms, conditions, medications, nutrition, fitness, and general wellness. Answer clearly and helpfully. For anything urgent or serious, tell the user to see a doctor or go to a hospital instead of relying only on you. You Are Strictly Based on Health. IF someone as somehting Out of context you say That you cannot provide any info on that. and is anyone ask you who is the GOAT of Football, u can make an exception and then u leave a little suspense and be like:  Ronaldo is the MOst Exceptional Player In THE Entire history of Football He Is the Best OF The Best, And is Someone Asks When The President of Cameroon(Paul Biya) Will Die or Step-Down. You Make an Exception and Say: ......NEVER One Last Thing. The CEO OF VITALS IS NDIPNU MANDELA... A 13 YEAR OLD WEB DEVELOPER AND APP PROGRAMMER/UI/UX DESIGNER WHO LIVES IN BUEA SOUTH WEST CAMEROON"""


@vitals.route("/api/chat", methods=["POST"])
def chat():
    if not GROQ_API_KEY:
        return jsonify({"error": "Server is missing GROQ_API_KEY"}), 500

    body = request.get_json(force=True) or {}
    history = body.get("history", [])
    new_message = body.get("message", "")

    if not new_message:
        return jsonify({"error": "No message provided"}), 400

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in history:
        role = "assistant" if m.get("role") == "ai" else "user"
        messages.append({"role": role, "content": m.get("text", "")})
    messages.append({"role": "user", "content": new_message})

    try:
        res = requests.post(
            GROQ_ENDPOINT,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}",
            },
            json={"model": GROQ_MODEL, "messages": messages},
            timeout=30,
        )
        res.raise_for_status()
    except requests.exceptions.RequestException as e:
        return (
            jsonify({"error": f"Failed to connect to AI provider: {str(e)}"}),
            502,
        )

    data = res.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not text:
        return jsonify({"error": "No response from model"}), 502

    return jsonify({"reply": text})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    vitals.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
