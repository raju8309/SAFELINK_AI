import React, { useState, useEffect } from "react";
import "./App.css";

// API base URL (Render backend by default, overridable via env var)
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://safelink-ai-epgg.onrender.com";  

// SVG Icon Definitions (Used for Sidebar and Auth Banners)

const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.149-.439 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h9.75M16.5 6V4.5M9 15.75V12h3V21h7.5A.75.75 0 0021 20.25V9.75" />
  </svg>
);

const IconSymptoms = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0zM15 11.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const IconChat = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM16.875 12a.375.375 0 100-.75.375.375 0 000 .75zM2.25 12c0-5.385 4.71-9.75 10.5-9.75S23.25 6.615 23.25 12c0 1.254-.25 2.45-.694 3.551M9 12h3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25A1.125 1.125 0 0010.125 10a1.125 1.125 0 00-1.125 1.125h2.25zm5.625-1.125A1.125 1.125 0 0015.625 10a1.125 1.125 0 00-1.125 1.125h2.25zM21 15.75c0 .771-.413 1.442-1.026 1.815L15 21l-3-3v-5.25A9.75 9.75 0 0112 2.25c5.385 0 9.75 4.365 9.75 9.75v3.75z" />
  </svg>
);

const IconHospitals = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75l-4.243-4.243a4.5 4.5 0 01-.264-5.918l.865-.864a6.75 6.75 0 0110.128 0l.865.864a4.5 4.5 0 01-.264 5.918L12 21.75zM15.75 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9.75l-3 3m0 0l3 3m-3-3h7.5" />
  </svg>
);

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 17.5c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

function App() {
  // Auth state
  const [user, setUser] = useState(null); // { user_id, email } or null
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Which page is active in sidebar
  const [activeTab, setActiveTab] = useState("home"); // "home" | "symptoms" | "chat" | "hospitals" | "history"

  // Symptom checker state
  const [age, setAge] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptomsText, setSymptomsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Chat assistant state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm your SafeLink AI helper. I can give general health and safety information, but I'm not a doctor. How are you feeling today?",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  // Chat history state
  const [chatHistory, setChatHistory] = useState([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [chatHistoryError, setChatHistoryError] = useState("");

  // Nearby hospitals state
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState("");

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("safelink_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && "email" in parsed) {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved user:", e);
      }
    }
  }, []);

  // Auth handlers
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    // Mock Authentication Logic
    setTimeout(() => {
      setAuthLoading(false);
      if (authEmail.length > 5 && authPassword.length >= 6) {
        const loggedInUser = {
          user_id: Date.now(),
          email: authEmail,
        };
        setUser(loggedInUser);
        localStorage.setItem("safelink_user", JSON.stringify(loggedInUser));
        setAuthPassword("");
        setAuthError("");
        setActiveTab("symptoms"); // Redirect after login
      } else {
        setAuthError(
          authMode === "login"
            ? "Invalid credentials."
            : "Email too short or password less than 6 chars."
        );
      }
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("safelink_user");
    setActiveTab("home");
  };

  // Symptom checker handler
  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        age: age ? Number(age) : null,
        temperature: temperature ? Number(temperature) : null,
        symptoms_text: symptomsText,
      };

      const headers = {
        "Content-Type": "application/json",
      };
      if (user?.user_id) {
        headers["X-User-Id"] = user.user_id;
      }

      const response = await fetch(`${API_BASE_URL}/api/symptom-check`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Something went wrong with the API.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to get result. Please check your connection or try again shortly."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Chat handler (30s timeout)
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatError("");

    const userMessage = {
      role: "user",
      content: chatInput.trim(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (user?.user_id) {
        headers["X-User-Id"] = user.user_id;
      }

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage.content }),
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const msg =
          (errData && errData.detail) ||
          `Chat API returned status ${response.status}.`;
        throw new Error(msg);
      }

      const data = await response.json();

      const replyText =
        data && typeof data.reply === "string" && data.reply.trim().length > 0
          ? data.reply
          : "Error: Received empty or invalid response format from backend.";

      const botMessage = {
        role: "assistant",
        content: replyText,
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat fetch error:", err);
      let errorMessage =
        "Network error. Check if the server is reachable and try again.";

      if (err.name === "AbortError") {
        errorMessage =
          "Request timed out (30s limit reached). The AI model is taking too long to respond.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setChatError(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  // Chat history handler
  const handleLoadChatHistory = async () => {
    if (!user?.user_id) {
      setChatHistoryError("Please log in to view your chat history.");
      return;
    }
    setChatHistoryError("");
    setChatHistoryLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-history`, {
        method: "GET",
        headers: {
          "X-User-Id": user.user_id,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const msg =
          (errData && errData.detail) || "Failed to load chat history.";
        throw new Error(msg);
      }

      const data = await response.json();
      setChatHistory(data);
    } catch (err) {
      console.error(err);
      setChatHistoryError(
        err.message || "Failed to load chat history. Please try again later."
      );
    } finally {
      setChatHistoryLoading(false);
    }
  };

  // Nearby hospitals handler
  const handleFindHospitals = () => {
    setHospitalsError("");
    setHospitalsLoading(true);

    if (!navigator.geolocation) {
      setHospitalsError("Location access is not supported on this device.");
      setHospitalsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/nearby-hospitals`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              radius_meters: 10000,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            const msg =
              (errData && errData.detail) || "Hospitals API error.";
            throw new Error(msg);
          }

          const data = await response.json();
          setHospitals(data);
        } catch (err) {
          console.error(err);
          setHospitalsError(
            err.message ||
              "Failed to fetch nearby hospitals. Please try again."
          );
        } finally {
          setHospitalsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setHospitalsError("Please allow location access to find nearby care.");
        setHospitalsLoading(false);
      }
    );
  };

  // A small helper: show login reminder text on protected pages
  const requireLoginMessage = !user
    ? "Please sign in on the Home page to use this feature."
    : "";

  // MAIN UI WITH SIDEBAR + HOME AS LANDING
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-circle">
            <IconShield />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-title">HealthAI</div>
            <div className="sidebar-subtitle">Your Health Assistant</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>

          <button
            className={activeTab === "home" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("home")}
          >
            <span className="nav-icon">
              <IconHome />
            </span>
            <span>Home</span>
          </button>

          <button
            className={activeTab === "symptoms" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("symptoms")}
          >
            <span className="nav-icon">
              <IconSymptoms />
            </span>
            <span>Symptom Checker</span>
          </button>

          <button
            className={activeTab === "chat" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("chat")}
          >
            <span className="nav-icon">
              <IconChat />
            </span>
            <span>AI Chat</span>
          </button>

          <button
            className={activeTab === "hospitals" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("hospitals")}
          >
            <span className="nav-icon">
              <IconHospitals />
            </span>
            <span>Nearby Hospitals</span>
          </button>

          <button
            className={activeTab === "history" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("history")}
          >
            <span className="nav-icon">
              <IconHistory />
            </span>
            <span>My History</span>
          </button>
        </nav>

        {user && (
          <div className="sidebar-footer">
            <button
              className="nav-item sidebar-logout"
              type="button"
              onClick={handleLogout}
            >
              <span className="nav-icon">
                <IconLogout />
              </span>
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="app-root">
        {/* Top bar */}
        <header className="top-bar">
          <div className="logo-wrap">
            <div className="logo-icon">
              <IconShield className="logo-shield" />
            </div>
            <div className="logo-text">
              <span className="logo-title">SafeLink</span>
              <span className="logo-subtitle">AI-Powered Health Insights</span>
            </div>
          </div>

          <div className="top-right">
            {user ? (
              <span className="pill">
                Signed in as <strong>{user.email}</strong>
              </span>
            ) : (
              <span className="pill">YOU ARE BROWSING AS GUEST</span>
            )}
          </div>
        </header>

        {/* HOME PAGE */}
        {activeTab === "home" && (
          <>
            <section className="hero">
              <div className="hero-pill">💚 AI-Powered Health Insights</div>
              <h1 className="hero-title">
                Your Personal <span>Health & Safety Companion</span>
              </h1>
              <p className="hero-subtitle">
                SafeLink AI helps you understand your symptoms, ask health
                questions in simple language, and quickly find nearby hospitals.
                It's designed as a supportive guide — not a medical device or a
                replacement for your doctor.
              </p>
            </section>

            <section className="home-main">
              <div className="home-features old-ui-features">
                <div
                  className="home-feature-block clickable-block"
                  onClick={() => setActiveTab("symptoms")}
                >
                  <h3>🩺 Symptom Checker</h3>
                  <p>
                    Enter your age, temperature, and symptoms in plain English.
                    SafeLink estimates a risk level (Low / Medium / High) and
                    highlights important warning signs.
                  </p>
                </div>

                <div
                  className="home-feature-block clickable-block"
                  onClick={() => setActiveTab("chat")}
                >
                  <h3>🤖 AI Health Chat</h3>
                  <p>
                    Ask general health questions and get friendly explanations.
                    The assistant always reminds you to see a real doctor for
                    serious or emergency situations.
                  </p>
                </div>

                <div
                  className="home-feature-block clickable-block"
                  onClick={() => setActiveTab("hospitals")}
                >
                  <h3>🏥 Nearby Hospitals</h3>
                  <p>
                    Use your location to see nearby hospitals (within ~10 km)
                    and open them directly in Maps when you need in-person care.
                  </p>
                </div>

                <div
                  className="home-feature-block clickable-block"
                  onClick={() => setActiveTab("history")}
                >
                  <h3>⏱️ My History</h3>
                  <p>
                    When you are logged in, your chats can be saved so you can
                    review questions you asked and the guidance you received.
                  </p>
                </div>
              </div>
            </section>

            {!user && (
              <section className="home-auth-actions">
                <div className="guest-mode-message old-ui-guest-banner">
                  <span className="guest-icon">
                    <IconStar />
                  </span>
                  <p>
                    <strong>Guest Mode Active</strong> You're currently
                    browsing as a guest. Create an account or sign in to save
                    your health history, track symptoms over time, and get
                    personalized health insights.
                  </p>
                </div>
              </section>
            )}

            <section className="home-auth-wrapper">
              <div className="home-auth-card card">
                <h3 className="home-auth-title">
                  {user ? "You're signed in" : "Sign in to your health hub"}
                </h3>
                <p className="home-auth-subtitle">
                  {user
                    ? "Use the menu on the left to open the Symptom Checker, AI Chat, or Nearby Hospitals."
                    : "Create a free account or log in to save your health checks and chat history."}
                </p>

                {!user && (
                  <form onSubmit={handleAuthSubmit} className="auth-form">
                    <div className="form-row">
                      <label>Email</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <label>Password</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="primary-btn login-btn"
                      disabled={authLoading}
                    >
                      {authLoading
                        ? "Please wait..."
                        : authMode === "login"
                        ? "Sign in"
                        : "Sign up"}
                    </button>

                    {authMode === "login" ? (
                      <p className="login-toggle-text">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="link-btn-inline"
                          onClick={() => setAuthMode("signup")}
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p className="login-toggle-text">
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="link-btn-inline"
                          onClick={() => setAuthMode("login")}
                        >
                          Log in
                        </button>
                      </p>
                    )}

                    {authError && <p className="error-text">{authError}</p>}
                  </form>
                )}

                {user && (
                  <button
                    className="secondary-btn"
                    onClick={() => setActiveTab("symptoms")}
                  >
                    Go to Symptom Checker →
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {/* SYMPTOM CHECKER PAGE */}
        {activeTab === "symptoms" && (
          <main className="cards-row">
            <section className="card checker-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="icon-circle">📈</div>
                  <div>
                    <h2>Symptom Checker</h2>
                    <p className="card-subtitle">
                      Describe how you feel for a risk estimate
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <p className="guard-text">
                  {requireLoginMessage} (Use the sign in box on the Home page.)
                </p>
              )}

              <form onSubmit={handleSymptomSubmit} className="symptom-form">
                <div className="two-col-row">
                  <div className="form-row">
                    <label>
                      <span className="label-icon">👤</span> Age (optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g., 25"
                    />
                  </div>

                  <div className="form-row">
                    <label>
                      <span className="label-icon">🌡️</span> Temp °F (optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="e.g., 101.3"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label>Describe your symptoms *</label>
                  <textarea
                    value={symptomsText}
                    onChange={(e) => setSymptomsText(e.target.value)}
                    placeholder="Example: I have headache, sore throat, mild cough, and feel very tired..."
                    rows={5}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading || !symptomsText.trim()}
                >
                  {loading ? "Analyzing..." : "Check Risk Level"}
                </button>

                {error && <p className="error-text">{error}</p>}

                {result && (
                  <div className="result-panel">
                    <div className="result-row">
                      <span className="result-label">Risk Level</span>
                      <span
                        className={`result-badge ${result.risk_level.toLowerCase()}`}
                      >
                        {result.risk_level}
                      </span>
                    </div>
                    <p className="result-score">
                      Risk score: <strong>{result.risk_score} / 100</strong>
                    </p>
                    <p className="result-advice">{result.advice}</p>
                    <p className="result-factors-label">Detected factors:</p>
                    <ul className="result-factors-list">
                      {result.detected_flags.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </section>
          </main>
        )}

        {/* CHAT PAGE */}
        {activeTab === "chat" && (
          <main className="cards-row">
            <section className="card chat-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="icon-circle chat-icon">💬</div>
                  <div>
                    <h2>AI Health Assistant</h2>
                    <p className="card-subtitle">
                      Ask general health questions (not a doctor).
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <p className="guard-text">
                  {requireLoginMessage} You can still test it, but history will
                  not be saved.
                </p>
              )}

              <div className="chat-box">
                <div className="chat-messages">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={
                        msg.role === "user"
                          ? "chat-message user"
                          : "chat-message assistant"
                      }
                    >
                      <span className="chat-role">
                        {msg.role === "user" ? "You" : "SafeLink AI"}
                      </span>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-message assistant">
                      <span className="chat-role">SafeLink AI</span>
                      <p>Thinking...</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChat} className="chat-input-row">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a health question..."
                  />
                  <button
                    type="submit"
                    className="icon-btn"
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    ➤
                  </button>
                </form>

                {chatError && <p className="error-text">{chatError}</p>}
              </div>
            </section>
          </main>
        )}

        {/* HOSPITALS PAGE */}
        {activeTab === "hospitals" && (
          <section className="card hospitals-section">
            <div className="card-header-row">
              <div className="card-title-left">
                <div className="icon-circle">🏥</div>
                <div>
                  <h2>Nearby Hospitals</h2>
                  <p className="card-subtitle">
                    Use your location to find nearby care options
                  </p>
                </div>
              </div>
            </div>

            {!user && (
              <p className="guard-text">
                {requireLoginMessage} You can still search hospitals as a guest.
              </p>
            )}

            <div className="hospitals-body">
              <button
                type="button"
                className="primary-btn hospitals-btn"
                onClick={handleFindHospitals}
                disabled={hospitalsLoading}
              >
                {hospitalsLoading ? "Finding hospitals..." : "Use My Location"}
              </button>

              {hospitalsError && (
                <p className="error-text" style={{ marginTop: "0.5rem" }}>
                  {hospitalsError}
                </p>
              )}

              <div className="hospital-list">
                {hospitals.length > 0 &&
                  hospitals.map((h, idx) => (
                    <div key={idx} className="hospital-card">
                      <h3 className="hospital-name">{h.name}</h3>
                      <p className="hospital-address">{h.address}</p>
                      {h.maps_url && (
                        <a
                          href={h.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="maps-link"
                        >
                          Open in Maps
                        </a>
                      )}
                    </div>
                  ))}

                {!hospitalsLoading &&
                  hospitals.length === 0 &&
                  !hospitalsError && (
                    <p className="no-results">
                      Tap "Use My Location" to see nearby hospitals.
                    </p>
                  )}
              </div>
            </div>
          </section>
        )}

        {/* HISTORY PAGE */}
        {activeTab === "history" && (
          <section className="card history-section">
            <div className="card-header-row">
              <div className="card-title-left">
                <div className="icon-circle">⏱️</div>
                <div>
                  <h2>My History</h2>
                  <p className="card-subtitle">
                    Saved chat history (symptom history can be added later).
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="small-ghost-btn"
                onClick={handleLoadChatHistory}
                disabled={chatHistoryLoading || !user}
              >
                {chatHistoryLoading
                  ? "Loading..."
                  : user
                  ? "Load chat history"
                  : "Login required"}
              </button>
            </div>

            {!user && (
              <p className="guard-text">
                {requireLoginMessage} History is only stored for logged-in
                users.
              </p>
            )}

            {chatHistoryError && (
              <p className="error-text">{chatHistoryError}</p>
            )}

            <div className="chat-history-list">
              {chatHistory.length === 0 && !chatHistoryLoading ? (
                <p className="no-results">
                  No saved chat yet. Ask questions in AI Chat while logged in to
                  see them here.
                </p>
              ) : (
                chatHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`chat-history-item ${
                      item.role === "user" ? "user" : "assistant"
                    }`}
                  >
                    <span className="chat-role">
                      {item.role === "user" ? "You" : "SafeLink AI"}
                    </span>
                    <p>{item.content}</p>
                    <span className="chat-history-time">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <footer className="app-footer">
          <small>
            Prototype · Not a medical device · Always consult a doctor for
            serious concerns or emergencies.
          </small>
        </footer>
      </div>
    </div>
  );
}

export default App;