// מייבא את הספריות הרגילות של React
import React from 'react';

// מייבא את הכלים מ־react-router-dom שמאפשרים ניתוב בתוך SPA (Single Page Application)
import {
  BrowserRouter as Router, // עוטף את כל האפליקציה ומנהל את ה-URL
  Routes,                   // רכיב עוטף לכל הראוטים באפליקציה
  Route                     // מגדיר ראוט (כתובת) אחת ספציפית
} from 'react-router-dom';

// מייבא את שני הקומפוננטות שתיצור:
import AreaList from './AreaList';     // הדף הראשי - רשימת האזורים
import EditArea from './EditArea';     // הדף לעריכת אזור (בעתיד: לפי השם מה-URL)

function App() {
  return (
    // עוטף את כל האפליקציה כדי ש-router-dom יוכל לעקוב אחרי ה-URL בדפדפן
    <Router>
      {/* Routes מגדיר את כל הכתובות שאפשר להגיע אליהן */}
      <Routes>

        {/* Route שמפנה לדף הראשי – כאן נציג את רשימת האזורים */}
        <Route path="/" element={<AreaList />} />

        {/* Route דינאמי – עובר לעמוד עריכה לפי שם האזור (מופיע בפרמטר name) */}
        <Route path="/edit/:name" element={<EditArea />} />

      </Routes>
    </Router>
  );
}

export default App;
