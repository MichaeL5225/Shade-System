import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AreaList.css';
axios.defaults.baseURL = 'http://localhost:5000';


function AreaList() {
  const [username, setUsername] = useState('');
  const [areas, setAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [newArea, setNewArea] = useState({ name: '', description: '' });
  const [pathFile, setPathFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUsername(localStorage.getItem('shade_username') || '');
  }, []);

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


  const toggleForm = () => { setShowForm(!showForm); };

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

  const handleDeleteSelected = () => {
    Promise.all(selectedAreas.map(name => axios.delete(`/api/areas/name/${encodeURIComponent(name)}`)))
      .then(() => { setAreas(areas.filter(area => !selectedAreas.includes(area.name))); setSelectedAreas([]); setDeleteMode(false); })
      .catch(err => console.error('שגיאה במחיקה:', err));
  };

  const handleDeleteSingle = async (name) => {
    const ok = window.confirm(`האם את/ה בטוח/ה שברצונך למחוק את האזור "${name}"?`);
    if (!ok) return;
    try {
      await axios.delete(`/api/areas/name/${encodeURIComponent(name)}`);
      setAreas(prev => prev.filter(a => a.name !== name));
    } catch (err) {
      console.error('שגיאה במחיקה:', err);
      alert('מחיקה נכשלה. נסה/י שוב.');
    }
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

      <div className="welcome-strip">
        <div className="welcome-inner">
          ברוך הבא{username ? `, ${username}` : ''} 
        </div>
      </div>
      
    {!showForm && (
      <section className="hero">
      <div className="hero-card">
        <h1 className="hero-title">ניהול אזורי קמפוס</h1>

        <div className="hero-actions">
          <div className="areas-panel">
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />

            {filteredAreas.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? "לא נמצאו אזורים" : "לא נוספו אזורים"}
              </div>
            ) : (
              filteredAreas.map((area, index) => (
                <div key={index} className="area-item">
                  <Link to={`/edit/${encodeURIComponent(area.name)}`}>
                    <strong>{area.name}</strong>
                  </Link>
                  <button
                    type="button"
                    className="trash-icon-btn"
                    title={`מחיקת האזור "${area.name}"`}
                    aria-label={`מחיקת האזור ${area.name}`}
                    onClick={() => handleDeleteSingle(area.name)}
                  >
                    🗑
                  </button>
                </div>
              ))
            )}

            {deleteMode && selectedAreas.length > 0 && (
              <div className="panel-actions">
                <button className="btn delete small" onClick={handleDeleteSelected}>
                  🗑 מחיקת נבחרים ({selectedAreas.length})
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="actions-row">
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