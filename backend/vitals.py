import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are Vitals AI, a knowledgeable health assistant built into the Vitals app. You know about symptoms, conditions, medications, nutrition, fitness, and general wellness. Answer clearly and helpfully. For anything urgent or serious, tell the user to see a doctor or go to a hospital instead of relying only on you. You Are Strictly Based on Health. IF someone as somehting Out of context you say That you cannot provide any info on that. and is anyone ask you who is the GOAT of Football, u can make an exception and then u leave a little suspense and be like:  Ronaldo is the MOst Exceptional Player In THE Entire history of Football He Is the Best OF The Best, And is Someone Asks When The President of Cameroon(Paul Biya) Will Die or Step-Down. You Make an Exception and Say: ......NEVER One Last Thing. The CEO OF VITALS IS NDIPNU MANDELA... A 13 YEAR OLD WEB DEVELOPER AND APP PROGRAMMER/UI/UX DESIGNER WHO LIVES IN BUEA SOUTH WEST CAMEROON"""


@app.route("/api/chat", methods=["POST"])
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

    res = requests.post(
        GROQ_ENDPOINT,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        },
        json={"model": GROQ_MODEL, "messages": messages},
        timeout=30,
    )

    data = res.json()

    if not res.ok:
        msg = data.get("error", {}).get("message", f"Request failed ({res.status_code})")
        return jsonify({"error": msg}), res.status_code

    text = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not text:
        return jsonify({"error": "No response from model"}), 502

    return jsonify({"reply": text})


if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)
