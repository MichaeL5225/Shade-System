import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const navigate = useNavigate();

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
  const closeRegister = () => {
    setShowRegister(false);
    setRegUsername("");
    setRegPassword("");
    setRegConfirm("");
    setRegEmail("");
    setRegPhone("");
    setRegError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('shade_username', (data?.username || username || '').trim());
        navigate("/areaList");
      } else {
        setErrorMessage("שם משתמש או סיסמה לא נכונים!");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  };

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
      setRegError("יש למלא את כל הפרטים");
      return;
    }
    if (p !== c) {
      setRegError("הסיסמאות לא תואמות!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await response.json();
      if (data.success) {
        window.alert("ההרשמה הצליחה! אפשר להתחבר עכשיו.");
        setShowRegister(false);
        setRegUsername("");
        setRegPassword("");
        setRegConfirm("");
        setRegEmail("");
        setRegPhone("");
        setErrorMessage("");
        setRegError("");
      } else {
        setRegError(data.error || "שגיאה בהרשמה");
      }
    } catch (error) {
      console.error("Error:", error);
      setRegError("שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  };

  // רקע מוגדר ב-JS
  const backgroundStyle = {
    backgroundImage: 'url("/HIT.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  return (
    <div style={backgroundStyle}>
      <div className="login-container">
        <h2>התחברות</h2>
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

        <div className="register-link" onClick={openRegister}>
          לא רשום עדיין? הירשם עכשיו
        </div>

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
                <button type="submit">
                  הרשם
                </button>
                <button type="button" onClick={closeRegister}>ביטול</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
