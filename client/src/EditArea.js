import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./EditArea.css";

function EditArea() {
  const { name } = useParams();
  const [areaData, setAreaData] = useState({
    name: "",
    description: "",
    path: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [shades, setShades] = useState([]);
  const [newShade, setNewShade] = useState({
    percentage: "",
    description: "",
    x: null,
    y: null,
    width: 30,
    height: 30,
  });

  const mapRef = useRef();

  useEffect(() => {
    axios
      .get(`/api/areas/name/${encodeURIComponent(name)}`)
      .then((res) => setAreaData(res.data))
      .catch((err) => console.error("שגיאה בטעינת אזור:", err));

    axios
      .get(`/api/shades/${encodeURIComponent(name)}`)
      .then((res) => setShades(res.data))
      .catch((err) => console.error("שגיאה בטעינת הצללות:", err));
  }, [name]);

  const handleToggleAdd = () => {
    setIsAdding((prev) => !prev);
    setNewShade({
      percentage: "",
      description: "",
      x: null,
      y: null,
      width: 30,
      height: 30,
    });
  };

  const handleMapClick = (e) => {
    if (!isAdding || !mapRef.current) return;

    const img = mapRef.current.querySelector("img.map-image");
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const mapRect = mapRef.current.getBoundingClientRect();

    // image offset inside the map container
    const offsetX = imgRect.left - mapRect.left;
    const offsetY = imgRect.top - mapRect.top;

    // click position inside the image box
    const clickXInImg = e.clientX - imgRect.left;
    const clickYInImg = e.clientY - imgRect.top;

    const maxX = imgRect.width - newShade.width;
    const maxY = imgRect.height - newShade.height;

    // clamp inside the image, then add the image→map offset
    const xWithinImg = Math.max(
      0,
      Math.min(clickXInImg - newShade.width / 2, maxX)
    );
    const yWithinImg = Math.max(
      0,
      Math.min(clickYInImg - newShade.height / 2, maxY)
    );

    setNewShade((prev) => ({
      ...prev,
      x: Math.round(offsetX + xWithinImg),
      y: Math.round(offsetY + yWithinImg),
    }));
  };

  const handleSaveShade = async () => {
    const { percentage, description, x, y, width, height } = newShade;
    if (!percentage || !description || x === null || y === null) {
      return alert("מלא את כל השדות לפני שמירה");
    }

    try {
      await axios.post("/api/shades", {
        Area: name,
        percentage: parseFloat(percentage),
        description,
        x,
        y,
        width,
        height,
      });
      alert("✔️ הצללה נשמרה בהצלחה");
      setIsAdding(false);

      const updated = await axios.get(
        `/api/shades/${encodeURIComponent(name)}`
      );
      setShades(updated.data);
    } catch (err) {
      console.error("שגיאה בשמירת הצללה:", err);
      alert("❌ שגיאה בשמירה");
    }
  };

  const handleDeleteShade = async (idLike) => {
    const id = idLike?.id ?? idLike?.ID ?? idLike; // be tolerant to API field names
    if (!id) return alert("אין מזהה להצללה למחיקה");

    if (!window.confirm("למחוק את ההצללה?")) return;

    try {
      await axios.delete(`/api/shades/${id}`);
      setShades((prev) => prev.filter((s) => (s.id ?? s.ID) !== id));
    } catch (err) {
      console.error("שגיאה במחיקה:", err);
      alert("❌ שגיאה במחיקת הצללה");
    }
  };

  return (
    <div className="edit-area">
      <header className="area-header">
        {editMode ? (
          <>
            <label>
              שם האזור:
              <input
                value={areaData.name}
                onChange={(e) =>
                  setAreaData({ ...areaData, name: e.target.value })
                }
              />
            </label>
            <label>
              תיאור אזור:
              <textarea
                value={areaData.description}
                onChange={(e) =>
                  setAreaData({ ...areaData, description: e.target.value })
                }
              />
            </label>
            <div className="button-group">
              <button
                className="button"
                onClick={async () => {
                  await axios.put(
                    `/api/areas/name/${encodeURIComponent(name)}`,
                    areaData
                  );
                  setEditMode(false);
                }}
              >
                💾 שמור
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="area-info">
              <h2>שם האזור: {areaData.name}</h2>
              <p>תיאור אזור: {areaData.description}</p>
            </div>

            <div className="button-group">
              <button className="button" onClick={() => setEditMode(true)}>
                ⚙️ ערוך אזור
              </button>
              <button className="button" onClick={handleToggleAdd}>
                {isAdding ? "❌ בטל הצללה" : "➕ הוסף הצללה"}
              </button>
            </div>
          </>
        )}
      </header>

      {isAdding && (
        <div className="shade-form">
          <input
            type="number"
            placeholder="אחוז"
            value={newShade.percentage}
            onChange={(e) =>
              setNewShade({ ...newShade, percentage: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="תיאור"
            value={newShade.description}
            onChange={(e) =>
              setNewShade({ ...newShade, description: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="X"
            value={newShade.x ?? ""}
            onChange={(e) =>
              setNewShade({ ...newShade, x: parseInt(e.target.value) })
            }
          />
          <input
            type="number"
            placeholder="Y"
            value={newShade.y ?? ""}
            onChange={(e) =>
              setNewShade({ ...newShade, y: parseInt(e.target.value) })
            }
          />
          <input
            type="number"
            placeholder="רוחב"
            value={newShade.width}
            onChange={(e) =>
              setNewShade({ ...newShade, width: parseInt(e.target.value) })
            }
          />
          <input
            type="number"
            placeholder="גובה"
            value={newShade.height}
            onChange={(e) =>
              setNewShade({ ...newShade, height: parseInt(e.target.value) })
            }
          />
          <button className="button" onClick={handleSaveShade}>
            💾 שמור הצללה
          </button>
        </div>
      )}

      <div className="map" ref={mapRef} onClick={handleMapClick}>
        {areaData.path ? (
          <img
            src={`/uploads/${areaData.path}`}
            alt="Map"
            className="map-image"
          />
        ) : (
          <p>🗺 כאן תופיע המפה שלך</p>
        )}

        {shades.map((shade, i) => (
          <div
            key={i}
            className="shade-marker" // <— new wrapper class
            style={{
              left: `${shade.x}px`,
              top: `${shade.y}px`,
              width: `${shade.width}px`,
              height: `${shade.height}px`,
            }}
          >
            <div className="shade-icon">🏠</div>

            <button
              className="shade-delete"
              aria-label="מחק הצללה"
              onClick={(e) => {
                e.stopPropagation(); // don't trigger map click
                handleDeleteShade(shade);
              }}
              title="מחק"
            >
              🗑
            </button>
          </div>
        ))}

        {isAdding && newShade.x !== null && newShade.y !== null && (
          <div
            className="shade-marker"
            style={{
              left: `${newShade.x}px`,
              top: `${newShade.y}px`,
              width: `${newShade.width}px`,
              height: `${newShade.height}px`,
            }}
          >
            <div className="shade-icon">🏠</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditArea;
