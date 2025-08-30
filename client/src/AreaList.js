import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AreaList.css';

function AreaList() {
  const [areas, setAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [newArea, setNewArea] = useState({ name: '', description: '' });
  const [pathFile, setPathFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get('/api/areas')
      .then(res => setAreas(res.data))
      .catch(err => console.error('שגיאה בקבלת אזורים:', err));
  }, []);

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
      .then(res => { setAreas([...areas, res.data]); setNewArea({ name: '', description: '' }); setPathFile(null); setShowForm(false); })
      .catch(err => console.error('שגיאה בשליחה:', err));
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
    

      <div className="button-bar">
        <button className="btn" onClick={toggleForm}>הוספת איזור</button>

        <div className="dropdown">
          <button className="dropbtn" onClick={toggleDropDown}>איזורים</button>
          {open && (
            <div className="dropdown-content">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
              />
              {filteredAreas.map((area, index) => (
                <div key={index} className="area-item">
                  {deleteMode && <input type="checkbox" checked={selectedAreas.includes(area.name)} onChange={() => toggleSelectArea(area.name)} />}
                  <Link to={`/edit/${encodeURIComponent(area.name)}`}><strong>{area.name}</strong></Link>
                </div>
              ))}

              <button className="btn" style={{ marginTop: "4px" }} onClick={() => { setDeleteMode(!deleteMode); setSelectedAreas([]); }}>
                {deleteMode ? "❌" : "🗑 מחיקה"}
              </button>
              {deleteMode && selectedAreas.length > 0 && <button className="btn delete" onClick={handleDeleteSelected}>🗑({selectedAreas.length})</button>}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <input type="text" placeholder="שם האזור" value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
          <textarea placeholder="תיאור האזור" value={newArea.description} onChange={(e) => setNewArea({ ...newArea, description: e.target.value })} />
          <input type="file" accept="image/*" onChange={(e) => setPathFile(e.target.files[0])} />
          <button onClick={handleAddArea}>הוספת איזור</button>
        </div>
      )}
    </div>
  );
}

export default AreaList;