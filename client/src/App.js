import React from "react";

// ייבוא כלים לניווט בין מסכים בתוך אפליקציית SPA
import {
  BrowserRouter as Router, 
  Routes, 
  Route, 
} from "react-router-dom";

// ייבוא המסכים (קומפוננטות עיקריות באתר)
import AreaList from "./AreaList"; 
import EditArea from "./EditArea"; 
import Login from "./Login";

function App() {
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
