// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [regError, setRegError] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const navigate = useNavigate();

  // מיפוי הודעות שגיאה אנגליות לעברית
  const mapToHebrewError = (msg = "") => {
    const m = String(msg || "").toLowerCase();

    // אימותים נפוצים
    if (m.includes("invalid username or password") || m.includes("incorrect") || m.includes("unauthorized"))
      return "שם משתמש או סיסמה לא נכונים!";
    if (m.includes("username required") || m.includes("missing username"))
      return "יש להזין שם משתמש.";
    if (m.includes("password required") || m.includes("missing password"))
      return "יש להזין סיסמה.";
    if (m.includes("user not found"))
      return "המשתמש לא נמצא.";
    if (m.includes("email already exists"))
      return "האימייל כבר רשום במערכת.";
    if (m.includes("username already exists"))
      return "שם המשתמש כבר בשימוש.";
    if (m.includes("invalid email"))
      return "כתובת האימייל אינה תקינה.";
    if (m.includes("weak password"))
      return "הסיסמה חלשה מדי.";
    if (m.includes("too many") || m.includes("rate limit"))
      return "יותר מדי ניסיונות. נסו שוב מאוחר יותר.";

    // שגיאות שרת/רשת
    if (m.includes("network") || m.includes("failed to fetch"))
      return "אין תקשורת עם השרת. בדקו את החיבור ונסו שוב.";
    if (m.includes("server") || m.includes("internal") || m.includes("500"))
      return "שגיאת שרת. נסו שוב מאוחר יותר.";
    if (m.includes("forbidden") || m.includes("403"))
      return "אין לכם הרשאה לבצע פעולה זו.";
    if (m.includes("not found") || m.includes("404"))
      return "המשאב המבוקש לא נמצא.";
    if (m.includes("bad request") || m.includes("400"))
      return "בקשה לא תקינה.";
    if (m.includes("unprocessable") || m.includes("422"))
      return "הנתונים שנשלחו אינם תקינים.";

    // ברירת מחדל: אם השרת כבר החזיר עברית — נציג אותה, אחרת ניסוח כללי
    return /[א-ת]/.test(msg) ? msg : "שם משתמש או סיסמה לא נכונים.";
  };

  // מיפוי לפי קוד סטטוס כאשר אין הודעה קריאה מהשרת
  const mapStatusToHebrew = (status) => {
    switch (status) {
      case 0:
        return "אין תקשורת עם השרת. בדקו את החיבור ונסו שוב.";
      case 400:
        return "בקשה לא תקינה.";
      case 401:
        return "שם משתמש או סיסמה לא נכונים!";
      case 403:
        return "אין לכם הרשאה לבצע פעולה זו.";
      case 404:
        return "המשאב המבוקש לא נמצא.";
      case 422:
        return "הנתונים שנשלחו אינם תקינים.";
      case 429:
        return "יותר מדי ניסיונות. נסו שוב מאוחר יותר.";
      case 500:
      default:
        return "שגיאת שרת. נסו שוב מאוחר יותר.";
    }
  };

  // פתיחת חלון הרשמה – איפוס שדות ושגיאות
  const openRegister = () => {
    setRegUsername("");
    setRegPassword("");
    setRegConfirm("");
    setRegEmail("");
    setRegPhone("");
    setRegError("");
    setErrorMessage("");
    setShowRegister(true);
  };

  // סגירת חלון הרשמה – איפוס מלא
  const closeRegister = () => {
    setShowRegister(false);
    setRegUsername("");
    setRegPassword("");
    setRegConfirm("");
    setRegEmail("");
    setRegPhone("");
    setRegError("");
  };

  // התחברות
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // ולידציה בסיסית בצד לקוח — הודעות בעברית
    if (!username.trim() && !password.trim()) {
      setErrorMessage("יש להזין שם משתמש וסיסמה.");
      return;
    }
    if (!username.trim()) {
      setErrorMessage("יש להזין שם משתמש.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("יש להזין סיסמה.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        // גוף לא-JSON
      }

      if (res.ok && data?.success) {
        const uname = (data?.username || username || "").trim();
        localStorage.setItem("shade_username", uname);

        if (typeof data.role !== "undefined") {
          localStorage.setItem("shade_role", String(data.role));
        }
        if (data.token) {
          localStorage.setItem("shade_token", data.token);
          axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        }

        navigate("/areaList");
      } else {
        const serverMsg = data?.error || data?.message || "";
        const msg = serverMsg ? mapToHebrewError(serverMsg) : mapStatusToHebrew(res.status);
        setErrorMessage(msg);
      }
    } catch (err) {
      console.error("שגיאת התחברות:", err);
      setErrorMessage("אין תקשורת עם השרת. בדקו את החיבור ונסו שוב.");
    }
  };

  // הרשמה
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setRegError("");

    const u = regUsername.trim();
    const p = regPassword.trim();
    const c = regConfirm.trim();
    const em = regEmail.trim();
    const ph = regPhone.trim();

    if (!u || !p || !c || !em || !ph) {
      setRegError("יש למלא את כל הפרטים.");
      return;
    }
    if (p !== c) {
      setRegError("הסיסמאות אינן תואמות.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: u,
          password: p,
          email: em,
          phone: ph,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        // גוף לא-JSON
      }

      if (res.ok && data?.success) {
        window.alert("ההרשמה הצליחה! אפשר להתחבר עכשיו.");
        closeRegister();
      } else {
        const serverMsg = data?.error || data?.message || "";
        const msg = serverMsg ? mapToHebrewError(serverMsg) : mapStatusToHebrew(res.status);
        setRegError(msg || "שגיאה בהרשמה.");
      }
    } catch (err) {
      console.error("שגיאת הרשמה:", err);
      setRegError("אין תקשורת עם השרת. בדקו את החיבור ונסו שוב.");
    }
  };

  const backgroundStyle = {
    backgroundImage: 'url("/HIT.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <div style={backgroundStyle}>
      <div className="login-container">
        <h2>התחברות</h2>

        {/* טופס התחברות */}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button type="submit">התחבר</button>
        </form>

        {/* קישור לפתיחת חלון הרשמה */}
        <div className="register-link" onClick={openRegister}>
          לא רשומים עדיין? הירשמו עכשיו
        </div>

        {/* טופס הרשמה */}
        {showRegister && (
          <div className="register-modal">
            <div className="register-content">
              <h2>הרשמה</h2>
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="שם משתמש"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="סיסמה"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="אימות סיסמה"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="כתובת מייל"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
                {regError && <div className="error-message">{regError}</div>}
                <button type="submit">הרשמה</button>
                <button type="button" onClick={closeRegister}>
                  ביטול
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
