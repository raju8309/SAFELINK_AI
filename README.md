# SafeLink AI – AI-Powered Community Health & Safety Assistant

 
## Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | [https://safelink-ai.vercel.app](https://safelink-ai.vercel.app) |
| **Backend API (Render)** | [https://safelink-ai-epgg.onrender.com](https://safelink-ai-epgg.onrender.com) |

> **Note:** The backend is hosted on Render's free tier and pings itself every few minutes to avoid cold starts. Initial requests may take a few seconds.

## About SafeLink AI

SafeLink AI is an **AI-powered health assistant** designed to provide general health and safety information to users. It combines modern AI capabilities with practical health tools to help users make informed decisions.

### What It Does:
- **AI Health Chatbot** — Fast, conversational Q&A using Groq LLM with intelligent fallback to rule-based responses
- **Symptom Checker** — Analyze symptoms and receive risk estimation scores with appropriate warnings
- **Hospital Locator** — Find nearby hospitals using OpenStreetMap Overpass API
- **User Authentication** — Mock login system for demonstration purposes
- **History Tracking** — Save and review chat and symptom history
- **Local LLM Support** — Optional Ollama integration (llama3.2) for local development

> **Disclaimer:** SafeLink AI is **not a medical device**. It provides general health and safety information only. Always consult a healthcare professional for medical advice.


## Features

### AI Features
- Fast health-related Q&A powered by **Groq LLM**
- Local fallback using **Ollama (llama3.2)** for offline development
- Safety-first responses — no diagnosis, only guidance

### Health Tools
- **Symptom Checker** with risk score and warning indicators
- **Nearby Hospitals Search** using OpenStreetMap Overpass API
- **Emergency Keyword Detection** for critical situations

### User Features
- Login / Signup (temporary mock authentication)
- Chat history persistence
- Symptom history tracking
- Fully responsive UI

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React | UI Framework |
| CSS | Custom Styling |
| Vercel | Deployment |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API Framework |
| SQLite | Database |
| Groq LLM API | AI Responses |
| Ollama (Optional) | Local LLM Support |
| Render | Deployment |

### Dev Tools
| Tool | Purpose |
|------|---------|
| Python venv | Virtual Environment |
| Node.js | Frontend Runtime |
| Git + GitHub | Version Control |


## Project Structure

```
SAFELINK_AI/
├── backend/
│   └── app/
│       ├── main.py
│       ├── requirements.txt
│       └── safelink.db (auto-created)
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── README.md
└── .gitignore
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd SAFELINK_AI/backend/app
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   ```

3. Activate the environment:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file with the following:
   ```env
   GROQ_API_KEY=your_key_here
   USE_OLLAMA=False
   OLLAMA_MODEL=llama3.2
   ```

6. Run the backend:
   ```bash
   python main.py
   ```

7. Backend starts at: `http://127.0.0.1:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd SAFELINK_AI/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   REACT_APP_API_BASE_URL=http://127.0.0.1:8000
   ```

4. Start the frontend:
   ```bash
   npm start
   ```

5. Frontend runs at: `http://localhost:3000`


## Deployment

### Backend (Render)

- **Platform:** Render Web Service
- **Build Command:**
  ```bash
  pip install -r backend/app/requirements.txt
  ```
- **Start Command:**
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT (or) python main.py
  ```

### Frontend (Vercel)

- **Platform:** Vercel
- **Root Directory:** `frontend`
- **Environment Variable:**
  ```
  REACT_APP_API_BASE_URL=https://safelink-ai-epgg.onrender.com
  ```

### CORS Origins Configured

```python
origins = [
    "http://localhost:3000",
    "https://safelink-ai.vercel.app",
    # Additional Vercel preview URLs as needed
]
```


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/chat` | Send message to AI chatbot |
| `POST` | `/api/symptom-check` | Analyze symptoms |
| `GET` | `/api/chat-history` | Retrieve chat history |
| `POST` | `/api/nearby-hospitals` | Find nearby hospitals |
| `POST` | `/api/signup` | User registration |
| `POST` | `/api/login` | User authentication |



## Credits

- **Groq** — For providing the LLM API
- **OpenStreetMap & Overpass API** — For hospital location data
- **Ollama** — For local LLM support
- **Vercel & Render** — For free-tier hosting


## Author

Made with ❤️ by **Raju Kotturi**

