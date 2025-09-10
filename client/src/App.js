// מייבא את הספריות הרגילות של React
import React from "react";

// מייבא את הכלים מ־react-router-dom שמאפשרים ניתוב בתוך SPA (Single Page Application)
import {
  BrowserRouter as Router, // עוטף את כל האפליקציה ומנהל את ה-URL
  Routes, // רכיב עוטף לכל הראוטים באפליקציה
  Route, // מגדיר ראוט (כתובת) אחת ספציפית
} from "react-router-dom";

// מייבא את שני הקומפוננטות שתיצור:
import AreaList from "./AreaList"; // הדף הראשי - רשימת האזורים
import EditArea from "./EditArea"; // הדף לעריכת אזור (בעתיד: לפי השם מה-URL)
import Login from "./Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* עמוד ההתחברות יהיה הראשון */}
        <Route path="/" element={<AreaList />} />

        {/* Route שמפנה לדף הראשי – כאן נציג את רשימת האזורים */}
        <Route path="/areaList" element={<AreaList />} />

        {/* Route דינאמי – עובר לעמוד עריכה לפי שם האזור (מופיע בפרמטר name) */}
        <Route path="/edit/:name" element={<EditArea />} />
      </Routes>
    </Router>
  );
}

export default App;
