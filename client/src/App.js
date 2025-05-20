import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [areas, setAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);

  // משתנה לשם ותיאור
  const [newArea, setNewArea] = useState({
    name: '',
    description: '',
  });

  // משתנה נפרד לקובץ תמונה (File)
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => setAreas(data));
  }, []);

  const toggleForm = () => setShowForm(!showForm);
  const toggleDropDown = () => setOpen(!open);

  const handleAddArea = () => {
    const { name, description } = newArea;
    if (!name || !description || !imageFile) {
      return alert('חובה למלא את כל השדות ולהעלות תמונה');
    }

    // יצירת אובייקט FormData – מאפשר שליחת קבצים
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('image', imageFile); // קובץ אמיתי

    fetch('/api/areas/upload', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        setAreas([...areas, data]);
        setNewArea({ name: '', description: '' });
        setImageFile(null);
        setShowForm(false);
      })
      .catch(err => console.error('שגיאה:', err));
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>ברוך הבא ל-Shade System</p>

        <div className="test">
          <button className="btn" onClick={toggleForm}>Add New Area</button>

          {showForm && (
            <div className="form-container">
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
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])} // שמירה בקובץ File
              />
              <button onClick={handleAddArea}>שלח</button>
            </div>
          )}

          <div className="dropdown">
            <button className="dropbtn" onClick={toggleDropDown}>Areas</button>
            {open && (
              <div className="dropdown-content">
                {areas.map((area, index) => (
                  <div key={index}>
                    <strong>{area.name}</strong><br />
                    {area.description}<br />
                    <img src={`/uploads/${area.image}`} alt={area.name} width="100" />
                    <hr />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
