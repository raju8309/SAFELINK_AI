from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import httpx
import sqlite3
from pathlib import Path
from datetime import datetime
import hashlib
import uvicorn  # Ensure uvicorn is imported if running via `python main.py`
import os      # NEW: for GROQ_API_KEY

app = FastAPI(
    title="SafeLink AI Backend",
    description="API for AI-Powered Community Health & Safety Assistant",
    version="0.8.0",
)

# CORS (allow frontend to talk to backend)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://safelink-ai-xa21.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite SETUP 

DB_PATH = Path(__file__).parent / "safelink.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    # Users table
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )

    # Symptom checks history
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS symptom_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            age INTEGER,
            temperature REAL,
            symptoms_text TEXT,
            risk_level TEXT,
            risk_score INTEGER,
            advice TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )

    # Chat messages history
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,          -- "user" or "assistant"
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )

    conn.commit()
    conn.close()


@app.on_event("startup")
def on_startup():
    init_db()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# Pydantic MODELS 

class SymptomCheckRequest(BaseModel):
    age: Optional[int] = None
    temperature: Optional[float] = None  # Fahrenheit
    symptoms_text: str


class SymptomCheckResponse(BaseModel):
    risk_level: str          # "Low", "Medium", "High"
    risk_score: int          # 0-100
    advice: str
    detected_flags: List[str]


# Chat models – accept either "message" OR "content"
class ChatRequest(BaseModel):
    message: Optional[str] = None
    content: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class NearbyHospitalsRequest(BaseModel):
    latitude: float
    longitude: float
    radius_meters: int = 5000  # not used directly now, kept for shape


class Hospital(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    place_id: str
    open_now: Optional[bool] = None
    maps_url: Optional[str] = None


# Auth models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user_id: int
    email: EmailStr


class SymptomHistoryItem(BaseModel):
    id: int
    created_at: str
    age: Optional[int]
    temperature: Optional[float]
    symptoms_text: str
    risk_level: str
    risk_score: int
    advice: str


class ChatHistoryItem(BaseModel):
    id: int
    created_at: str
    role: str
    content: str


# ========= Symptom Checker Logic =========

HIGH_RISK_KEYWORDS = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "blue lips",
    "high fever",
    "confusion",
]

MEDIUM_RISK_KEYWORDS = [
    "fever",
    "cough",
    "sore throat",
    "body pain",
    "fatigue",
    "headache",
    "loss of smell",
    "loss of taste",
]


def analyze_symptoms(payload: SymptomCheckRequest) -> SymptomCheckResponse:
    text = payload.symptoms_text.lower()

    flags: List[str] = []

    # Temperature flags
    temp_score = 0
    if payload.temperature:
        if payload.temperature >= 102:
            flags.append("High fever")
            temp_score = 30
        elif payload.temperature >= 100.4:
            flags.append("Mild fever")
            temp_score = 15

    # Age flags
    age_score = 0
    if payload.age:
        if payload.age >= 65:
            flags.append("Older age (65+)")
            age_score = 15
        elif payload.age <= 5:
            flags.append("Young age (≤5)")
            age_score = 15

    # Keyword flags
    high_hits = [k for k in HIGH_RISK_KEYWORDS if k in text]
    medium_hits = [k for k in MEDIUM_RISK_KEYWORDS if k in text]

    if high_hits:
        flags.extend([f"High-risk symptom: {k}" for k in high_hits])
    if medium_hits:
        flags.extend([f"Medium-risk symptom: {k}" for k in medium_hits])

    keyword_score = len(high_hits) * 25 + len(medium_hits) * 10

    # Combine for simple "AI-style" score
    raw_score = temp_score + age_score + keyword_score
    risk_score = max(0, min(100, raw_score))

    # Map score → risk level + advice
    if risk_score >= 60 or high_hits:
        risk_level = "High"
        advice = (
            "Your symptoms may indicate a higher risk situation. "
            "Consider seeking immediate medical attention or contacting your doctor. "
            "If you have severe chest pain, trouble breathing, or confusion, call emergency services."
        )
    elif risk_score >= 30:
        risk_level = "Medium"
        advice = (
            "Your symptoms suggest a moderate level of concern. "
            "Monitor your condition, rest, stay hydrated, and consider contacting a healthcare provider "
            "if symptoms worsen or persist."
        )
    else:
        risk_level = "Low"
        advice = (
            "Your symptoms currently appear mild. "
            "Rest, drink fluids, and watch for any changes or worsening. "
            "If you feel worse, contact a medical professional."
        )

    if not flags:
        flags.append("No specific high/medium risk symptoms detected from description.")

    return SymptomCheckResponse(
        risk_level=risk_level,
        risk_score=risk_score,
        advice=advice,
        detected_flags=flags,
    )


def save_symptom_check_to_db(
    user_id: int, payload: SymptomCheckRequest, result: SymptomCheckResponse
) -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO symptom_checks (
            user_id, age, temperature, symptoms_text,
            risk_level, risk_score, advice, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            payload.age,
            payload.temperature,
            payload.symptoms_text,
            result.risk_level,
            result.risk_score,
            result.advice,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_symptom_history_from_db(user_id: int) -> List[SymptomHistoryItem]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, created_at, age, temperature, symptoms_text,
               risk_level, risk_score, advice
        FROM symptom_checks
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT 50
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()

    history: List[SymptomHistoryItem] = []
    for row in rows:
        history.append(
            SymptomHistoryItem(
                id=row["id"],
                created_at=row["created_at"],
                age=row["age"],
                temperature=row["temperature"],
                symptoms_text=row["symptoms_text"],
                risk_level=row["risk_level"],
                risk_score=row["risk_score"],
                advice=row["advice"],
            )
        )
    return history


def save_chat_pair_to_db(user_id: int, user_message: str, assistant_reply: str) -> None:
    """
    Save both sides of a chat turn for a user.
    """
    conn = get_db()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat()

    cur.execute(
        """
        INSERT INTO chat_messages (user_id, role, content, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, "user", user_message, now),
    )
    cur.execute(
        """
        INSERT INTO chat_messages (user_id, role, content, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, "assistant", assistant_reply, now),
    )

    conn.commit()
    conn.close()


def get_chat_history_from_db(user_id: int) -> List[ChatHistoryItem]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, created_at, role, content
        FROM chat_messages
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT 50
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()

    history: List[ChatHistoryItem] = []
    for row in rows:
        history.append(
            ChatHistoryItem(
                id=row["id"],
                created_at=row["created_at"],
                role=row["role"],
                content=row["content"],
            )
        )
    return history


#  Chat Assistant Logic (Groq LLaMA 3 + optional Ollama + fallback)

GROQ_API_KEY = os.getenv(" GROQ_API_KEY")  # NEW: get from environment variable

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"


def _fallback_rule_based_reply(text: str) -> str:
    if "fever" in text or "temperature" in text:
        return (
            "A fever is often a sign that your body is fighting an infection. "
            "In many mild cases, rest, fluids, and fever-reducing medicine (if recommended by a doctor) can help. "
            "If your temperature is very high, lasts more than a couple of days, or you feel very unwell, "
            "you should contact a healthcare provider."
        )

    if "cough" in text or "sore throat" in text:
        return (
            "Cough and sore throat are common with colds, flu, and COVID-like illnesses. "
            "Try to rest, stay hydrated, and monitor your breathing. "
            "If you have trouble breathing, chest pain, or symptoms that are getting worse, "
            "contact a doctor or urgent care."
        )

    if "anxious" in text or "anxiety" in text or "stress" in text:
        return (
            "Feeling anxious or stressed is very common, especially when you are sick or worried. "
            "Try slow deep breaths, short walks if you can, and talking to someone you trust. "
            "If your anxiety feels overwhelming or constant, consider reaching out to a mental health professional."
        )

    if "covid" in text or "covid-19" in text:
        return (
            "If you think you might have COVID-19, it's usually recommended to test, self-isolate, "
            "and follow local health guidelines. "
            "Monitor your symptoms closely and contact a medical provider if you feel worse, "
            "have trouble breathing, or are in a high-risk group."
        )

    return (
        "Hello! I'm happy to help with any general health and safety questions you may have. "
        "Please keep in mind that I'm not a doctor, so if you're experiencing symptoms or have concerns "
        "about your health, it's always best to consult a qualified healthcare professional for "
        "personalized guidance. What's on your mind?"
    )


def generate_chat_reply(user_message: str) -> str:
    text = user_message.lower()

    emergency_keywords = [
        "cant breathe",
        "can't breathe",
        "difficulty breathing",
        "chest pain",
        "blue lips",
        "unconscious",
        "seizure",
        "stroke",
        "heart attack",
    ]
    if any(k in text for k in emergency_keywords):
        return (
            "This sounds like it could be an emergency. "
            "Stop using this app and contact emergency services or go to the nearest hospital immediately. "
            "I am not a doctor and cannot handle emergencies."
        )

    system_prompt = (
        "You are a cautious health information assistant. "
        "You ONLY provide general health and safety information, not medical diagnoses. "
        "You are NOT a doctor. "
        "Always encourage the user to consult a healthcare professional for diagnosis "
        "or serious concerns. "
        "Keep answers clear and concise (3–6 sentences)."
    )

    # 1) Primary: Groq LLaMA 3 (for deployment / when GROQ_API_KEY is set)
    if GROQ_API_KEY:
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama3-8b-8192",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message},
                        ],
                        "temperature": 0.3,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                reply = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )
                if reply and reply.strip():
                    return reply.strip()
        except Exception as e:
            print("Groq LLM error:", e)

    # 2) Secondary: local Ollama (for local dev if running)
    try:
        payload = {
            "model": "llama3",
            "prompt": system_prompt + "\n\nUser message:\n" + user_message,
            "stream": False,
        }
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(OLLAMA_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
        reply = data.get("response", "")
        if reply and reply.strip():
            return reply.strip()
    except Exception as e:
        print("Ollama error:", e)

    # 3) Final fallback: rule-based
    return _fallback_rule_based_reply(text)


#  Nearby hospitals using Overpass (upto 7miles / 10km)

@app.post("/api/nearby-hospitals", response_model=List[Hospital])
def nearby_hospitals(payload: NearbyHospitalsRequest):
    """
    Find hospitals within 10 km using Overpass API (OpenStreetMap).
    """
    lat = payload.latitude
    lon = payload.longitude
    radius = 10000  # (upto 7miles)

    overpass_url = "https://overpass-api.de/api/interpreter"

    query = f"""
    [out:json];
    (
      node["amenity"="hospital"](around:{radius},{lat},{lon});
      way["amenity"="hospital"](around:{radius},{lat},{lon});
      relation["amenity"="hospital"](around:{radius},{lat},{lon});
    );
    out center;
    """

    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(overpass_url, data=query)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        print("Overpass error:", e)
        raise HTTPException(status_code=502, detail="Failed to fetch nearby hospitals")

    hospitals: List[Hospital] = []

    for el in data.get("elements", []):
        name = el.get("tags", {}).get("name", "Unnamed Hospital")

        if "lat" in el and "lon" in el:
            lat_h = el["lat"]
            lon_h = el["lon"]
        elif "center" in el:
            lat_h = el["center"]["lat"]
            lon_h = el["center"]["lon"]
        else:
            continue

        hospitals.append(
            Hospital(
                name=name,
                address=name,
                lat=lat_h,
                lng=lon_h,
                rating=None,
                user_ratings_total=None,
                place_id=str(el.get("id")),
                open_now=None,
                maps_url=f"https://www.openstreetmap.org/?mlat={lat_h}&mlon={lon_h}#map=17/{lat_h}/{lon_h}",
            )
        )

    return hospitals


#  AUTH ENDPOINTS (Signup / Login) 

@app.post("/api/signup", response_model=LoginResponse)
def signup(payload: SignupRequest):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
    existing = cur.fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email is already registered.")

    password_hash = hash_password(payload.password)
    now = datetime.utcnow().isoformat()

    cur.execute(
        "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
        (payload.email, password_hash, now),
    )
    conn.commit()

    user_id = cur.lastrowid
    conn.close()

    return LoginResponse(user_id=user_id, email=payload.email)


@app.post("/api/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, password_hash FROM users WHERE email = ?",
        (payload.email,),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    stored_hash = row["password_hash"]
    if stored_hash != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return LoginResponse(user_id=row["id"], email=payload.email)


#  API ROUTES 

@app.get("/")
def read_root():
    return {"message": "SafeLink AI Backend is running 🚀"}


@app.post("/api/symptom-check", response_model=SymptomCheckResponse)
def symptom_check(
    payload: SymptomCheckRequest,
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    """
    If X-User-Id header is sent, save this check to that user's history.
    """
    result = analyze_symptoms(payload)

    if x_user_id is not None:
        try:
            save_symptom_check_to_db(x_user_id, payload, result)
        except Exception as e:
            print("Error saving symptom check:", e)

    return result


@app.get("/api/symptom-history", response_model=List[SymptomHistoryItem])
def symptom_history(
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id")
):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header.")

    history = get_symptom_history_from_db(x_user_id)
    return history


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    """
    Chat with AI; if X-User-Id is set, save the chat turn to history.
    """
    text = payload.message or payload.content
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Message is required.")

    reply = generate_chat_reply(text)

    if x_user_id is not None:
        try:
            save_chat_pair_to_db(x_user_id, text, reply)
        except Exception as e:
            print("Error saving chat:", e)

    return ChatResponse(reply=reply)


@app.get("/api/chat-history", response_model=List[ChatHistoryItem])
def chat_history(
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id")
):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header.")

    history = get_chat_history_from_db(x_user_id)
    return history


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)