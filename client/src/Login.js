import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false); // האם להציג את המודל
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const navigate = useNavigate();

  // התחברות
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        navigate("/areaList");
      } else {
        alert("שם משתמש או סיסמה לא נכונים!");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // הרשמה
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regConfirm) {
      alert("מלא את כל השדות!");
      return;
    }
    if (regPassword !== regConfirm) {
      alert("הסיסמאות לא תואמות!");
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
        alert("ההרשמה הצליחה! אפשר להתחבר עכשיו.");
        setShowRegister(false);
        setRegUsername("");
        setRegPassword("");
        setRegConfirm("");
      } else {
        alert("שגיאה בהרשמה: " + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>התחברות</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">התחבר</button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setShowRegister(true)}>הרשמה</button>
      </div>

      {/* מודל הרשמה */}
      {showRegister && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px" }}>
            <h3>הרשמה</h3>
            <form onSubmit={handleRegister}>
              <div>
                <input
                  type="text"
                  placeholder="שם משתמש"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="סיסמה"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="אימות סיסמה"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                />
              </div>
              <button type="submit">הרשם</button>
              <button type="button" onClick={() => setShowRegister(false)}>ביטול</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
