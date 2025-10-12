// App.js
import React, { useEffect } from "react";
import axios from "axios";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import AreaList from "./AreaList";
import EditArea from "./EditArea";
import Login from "./Login";

function App() {
  // בעת עליית האפליקציה/רענון דף:
  // 1) מרים את ה-token שנשמר בלוגין
  // 2) קובע כותרת Authorization לכל בקשות axios הבאות
  useEffect(() => {
    const t = localStorage.getItem("shade_token");
    if (t) {
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }

    // אם את עובדת מול שרת על פורט/דומיין קבועים—אפשר לקבוע baseURL פעם אחת:
    // axios.defaults.baseURL = "http://localhost:5000";
  }, []);

  return (
    <Router>
      <Routes>
        {/* דף התחברות ברירת המחדל */}
        <Route path="/" element={<Login />} />

        {/* דף ראשי – רשימת האזורים */}
        <Route path="/areaList" element={<AreaList />} />

        {/* דף עריכה – טוען אזור לפי הפרמטר :name מה-URL */}
        <Route path="/edit/:name" element={<EditArea />} />
      </Routes>
    </Router>
  );
}

export default App;
