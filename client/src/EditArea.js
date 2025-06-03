import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './EditArea.css';

function EditArea() {
  const { name } = useParams();
  const [areaData, setAreaData] = useState({ name: '', description: '', path: '' });
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [shades, setShades] = useState([]);
  const [newShade, setNewShade] = useState({
    percentage: '',
    description: '',
    x: null,
    y: null,
    width: 30,
    height: 30
  });

  const mapRef = useRef();

  useEffect(() => {
    axios.get(`/api/areas/name/${encodeURIComponent(name)}`)
      .then(res => setAreaData(res.data))
      .catch(err => console.error('שגיאה בטעינת אזור:', err));

    axios.get(`/api/shades/${encodeURIComponent(name)}`)
      .then(res => setShades(res.data))
      .catch(err => console.error('שגיאה בטעינת הצללות:', err));
  }, [name]);

  const handleToggleAdd = () => {
    setIsAdding(prev => !prev);
    setNewShade({
      percentage: '',
      description: '',
      x: null,
      y: null,
      width: 30,
      height: 30
    });
  };

  const handleMapClick = (e) => {
    if (!isAdding || !mapRef.current) return;

    const img = mapRef.current.querySelector('img');
    const rect = img.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const maxX = rect.width - newShade.width;
    const maxY = rect.height - newShade.height;

    const x = Math.max(0, Math.min(clickX - newShade.width / 2, maxX));
    const y = Math.max(0, Math.min(clickY - newShade.height / 2, maxY));

    setNewShade(prev => ({
      ...prev,
      x: Math.round(x),
      y: Math.round(y)
    }));
  };

  const handleSaveShade = async () => {
    const { percentage, description, x, y, width, height } = newShade;
    if (!percentage || !description || x === null || y === null) {
      return alert("מלא את כל השדות לפני שמירה");
    }

    try {
      await axios.post('/api/shades', {
        Area: name,
        percentage: parseFloat(percentage),
        description,
        x, y, width, height
      });
      alert("✔️ הצללה נשמרה בהצלחה");
      setIsAdding(false);

      // רענון הצללות
      const updated = await axios.get(`/api/shades/${encodeURIComponent(name)}`);
      setShades(updated.data);
    } catch (err) {
      console.error('שגיאה בשמירת הצללה:', err);
      alert("❌ שגיאה בשמירה");
    }
  };

  return (
    <div className="edit-area">
      <header className="area-header">
        {editMode ? (
          <>
            <input value={areaData.name} onChange={e => setAreaData({ ...areaData, name: e.target.value })} />
            <textarea value={areaData.description} onChange={e => setAreaData({ ...areaData, description: e.target.value })} />
            <button onClick={async () => {
              await axios.put(`/api/areas/name/${encodeURIComponent(name)}`, areaData);
              setEditMode(false);
            }}>💾 שמור</button>
          </>
        ) : (
          <>
            <h2>{areaData.name}</h2>
            <p>{areaData.description}</p>
            <button onClick={() => setEditMode(true)}>⚙️ ערוך אזור</button>
          </>
        )}
        <button onClick={handleToggleAdd}>
          {isAdding ? '❌ בטל הצללה' : '➕ הוסף הצללה'}
        </button>
      </header>

      {isAdding && (
        <div className="shade-form">
          <input
            type="number"
            placeholder="אחוז"
            value={newShade.percentage}
            onChange={(e) => setNewShade({ ...newShade, percentage: e.target.value })}
          />
          <input
            type="text"
            placeholder="תיאור"
            value={newShade.description}
            onChange={(e) => setNewShade({ ...newShade, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="X"
            value={newShade.x ?? ''}
            onChange={(e) => setNewShade({ ...newShade, x: parseInt(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Y"
            value={newShade.y ?? ''}
            onChange={(e) => setNewShade({ ...newShade, y: parseInt(e.target.value) })}
          />
          <input
            type="number"
            placeholder="רוחב"
            value={newShade.width}
            onChange={(e) => setNewShade({ ...newShade, width: parseInt(e.target.value) })}
          />
          <input
            type="number"
            placeholder="גובה"
            value={newShade.height}
            onChange={(e) => setNewShade({ ...newShade, height: parseInt(e.target.value) })}
          />
          <button onClick={handleSaveShade}>💾 שמור הצללה</button>
        </div>
      )}

      <div className="map" ref={mapRef} onClick={handleMapClick}>
        {areaData.path ? (
          <img src={`/uploads/${areaData.path}`} alt="Map" className="map-image" />
        ) : <p>🗺 כאן תופיע המפה שלך</p>}

        {/* הצללות קיימות */}
        {shades.map((shade, i) => (
          <div
            key={i}
            className="shade-icon"
            style={{
              left: `${shade.x}px`,
              top: `${shade.y}px`,
              width: `${shade.width}px`,
              height: `${shade.height}px`
            }}
          >
            🏠
          </div>
        ))}

        {/* הצללה חדשה */}
        {isAdding && newShade.x !== null && newShade.y !== null && (
          <div
            className="shade-icon"
            style={{
              left: `${newShade.x}px`,
              top: `${newShade.y}px`,
              width: `${newShade.width}px`,
              height: `${newShade.height}px`
            }}
          >
            🏠
          </div>
        )}
      </div>
    </div>
  );
}

export default EditArea;
