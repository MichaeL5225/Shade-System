import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AreaList.css';
axios.defaults.baseURL = 'http://localhost:5000';


function AreaList() {
  const [areas, setAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [newArea, setNewArea] = useState({ name: '', description: '' });
  const [pathFile, setPathFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);


  useEffect(() => {
    axios.get('/api/areas')
      .then(res => setAreas(res.data))
      .catch(err => console.error('שגיאה בקבלת אזורים:', err));
  }, []);

  useEffect(() => {
  return () => {
    if (preview) URL.revokeObjectURL(preview);
  };
}, [preview]);


  const toggleForm = () => { setShowForm(!showForm); setOpen(false); };
  const toggleDropDown = () => { setOpen(!open); setShowForm(false); };

  const handleAddArea = () => {
    const { name, description } = newArea;
    if (!name || !description || !pathFile) return alert('חובה למלא את כל השדות ולהעלות תמונה');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('path', pathFile);

    axios.post('/api/areas/upload', formData)
      .then(res => {
        setAreas([...areas, res.data]);
        setNewArea({ name: '', description: '' });
        setPathFile(null);
       
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);

        setShowForm(false);
      })

      .catch(err => {
        const msg = err.response?.data?.error || err.message;
        console.error('שגיאה בשליחה:', msg);
        alert(`שגיאה בשמירה: ${msg}`);
      });
  };

  const toggleSelectArea = (name) => {
    setSelectedAreas(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleDeleteSelected = () => {
    Promise.all(selectedAreas.map(name => axios.delete(`/api/areas/name/${encodeURIComponent(name)}`)))
      .then(() => { setAreas(areas.filter(area => !selectedAreas.includes(area.name))); setSelectedAreas([]); setDeleteMode(false); })
      .catch(err => console.error('שגיאה במחיקה:', err));
  };

  const filteredAreas = areas.filter(area => area.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }

    setPathFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };


  return (
    <div
      className="App"
      style={{
        backgroundImage: "url('/HIT.jpg')", // 👈 פה הרקע
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh"
      }}
    >
      
    {!showForm && (
      <section className="hero">
      <div className="hero-card">
        <h1 className="hero-title">ניהול אזורי קמפוס</h1>
        <p className="hero-subtitle">בחיר/י פעולה: הוספת אזור חדש או צפייה באזורים קיימים</p>

        <div className="hero-actions">
          <div className="dropdown">
            <button className="btn-hero btn-secondary" onClick={toggleDropDown}>
              אזורים
            </button>

            {open && (
              <div className="dropdown-content">
                <input
                  type="text"
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar"
                />
                {filteredAreas.map((area, index) => (
                  <div key={index} className="area-item">
                    {deleteMode && (
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area.name)}
                        onChange={() => toggleSelectArea(area.name)}
                      />
                    )}
                    <Link to={`/edit/${encodeURIComponent(area.name)}`}>
                      <strong>{area.name}</strong>
                    </Link>
                  </div>
                ))}
                <button
                  className="btn small"
                  style={{ marginTop: 4 }}
                  onClick={() => { setDeleteMode(!deleteMode); setSelectedAreas([]); }}
                >
                {deleteMode ? "❌" : "🗑 מחיקה"}
                </button>
                {deleteMode && selectedAreas.length > 0 && (
                  <button className="btn delete small" onClick={handleDeleteSelected}>
                    🗑 ({selectedAreas.length})
                  </button>
                )}
              </div>
            )}
          </div>

          <button className="btn-hero btn-primary" onClick={toggleForm}>
            הוספת אזור
          </button>
        </div>
      </div>
    </section>
  )}



      {showForm && (
        <div className="form-container">

          <h2 className="form-title">הוספת איזור</h2> 

          <div className="form-body">
            <input 
              type="text" 
              placeholder="שם האזור" 
              value={newArea.name} 
              onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} 
            />
            <textarea 
              placeholder="תיאור האזור" 
              value={newArea.description} 
              onChange={(e) => setNewArea({ ...newArea, description: e.target.value })} 
            />
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
            />

            {pathFile && (
              <button
                type="button"
                className="trash-btn"  
                title="מחיקת תמונה"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(null);
                  setPathFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}         
              >
                🗑
              </button>
            )}
          </div>

          {preview && (
            <img src={preview} alt="תצוגה מקדימה" className="image-preview" />
          )}
          
          
          <div className="form-actions">
            <button
              className="btn back-btn"
              onClick={() => setShowForm(false)}
            >
              ← חזרה
            </button>
            
            <button
              className="btn submit-btn" 
              onClick={handleAddArea}
            >
              הוסף
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AreaList;