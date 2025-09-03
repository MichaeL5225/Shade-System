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
  const navigate = useNavigate();

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
    if (!regUsername || !regPassword || !regConfirm) {
      setErrorMessage("מלא את כל השדות!");
      return;
    }
    if (regPassword !== regConfirm) {
      setErrorMessage("הסיסמאות לא תואמות!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRegister(false);
        setRegUsername("");
        setRegPassword("");
        setRegConfirm("");
        setErrorMessage("ההרשמה הצליחה! אפשר להתחבר עכשיו.");
      } else {
        setErrorMessage(data.error || "שגיאה בהרשמה");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("שגיאה בשרת. נסה שוב מאוחר יותר.");
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

        <div className="register-link" onClick={() => setShowRegister(true)}>
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
                <button type="submit">הרשם</button>
                <button type="button" onClick={() => setShowRegister(false)}>ביטול</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
