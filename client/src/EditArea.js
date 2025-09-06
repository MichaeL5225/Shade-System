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
  const [hoveredId, setHoveredId] = useState(null);
  const getId = (s, idx) => s?.id ?? s?.ID ?? s?.Id ?? idx;
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

  const formatPercent = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    if (!Number.isFinite(n)) return ""; // ← prevents %undefined
    return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
  };

  const getBadgeStyle = (w, h) => {
    const minDim = Math.max(1, Math.min(Number(w) || 0, Number(h) || 0));
    // font grows with size but stays within sensible bounds
    const font = Math.round(Math.max(12, Math.min(28, minDim * 0.22)));
    const padY = Math.round(Math.max(2, font * 0.25));
    const padX = Math.round(Math.max(6, font * 0.4));
    // place the badge just above the marker
    const top = -(font + padY * 2 + 6);
    return {
      fontSize: `${font}px`,
      padding: `${padY}px ${padX}px`,
      borderRadius: `${Math.round(font * 0.5)}px`,
      top: `${top}px`,
    };
  };

  const pick = (obj, keys) => {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
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

      <div className="area-row">
        {/* MAP (unchanged inside) */}
        <div className="map-wrap">
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
                key={getId(shade, i)}
                className={`shade-marker ${
                  hoveredId === getId(shade, i) ? "is-hovered" : ""
                }`}
                style={{
                  left: `${shade.x}px`,
                  top: `${shade.y}px`,
                  width: `${shade.width}px`,
                  height: `${shade.height}px`,
                }}
                onMouseEnter={() => setHoveredId(getId(shade, i))}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(getId(shade, i))}
                onBlur={() => setHoveredId(null)}
              >
                <span
                  className="shade-percent"
                  style={getBadgeStyle(
                    pick(shade, ["width", "Width"]),
                    pick(shade, ["height", "Height"])
                  )}
                >
                  {formatPercent(pick(shade, ["percentage", "Percentage"]))}
                </span>

                <div className="shade-icon">🏠</div>
                <button
                  className="shade-delete"
                  aria-label="מחק הצללה"
                  onClick={(e) => {
                    e.stopPropagation();
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
                {newShade.percentage !== "" && (
                  <span
                    className="shade-percent"
                    style={getBadgeStyle(newShade.width, newShade.height)}
                  >
                    {formatPercent(newShade.percentage)}
                  </span>
                )}
                <div className="shade-icon">🏠</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SHADES TABLE (single instance) */}
        <aside className="shade-panel" aria-label="טבלת הצללות">
          <div className="panel-header">
            <h3>הצללות</h3>
            <span className="panel-count">{shades.length}</span>
          </div>

          <div className="panel-table-wrap">
            <table className="shade-table">
              <thead>
                <tr>
                  <th>שם הצללה</th>
                  <th>אחוז</th>
                  <th className="del-head">מחיקה</th>
                </tr>
              </thead>
              <tbody>
                {shades.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty-row">
                      אין הצללות להצגה
                    </td>
                  </tr>
                ) : (
                  shades.map((s, idx) => {
                    const desc = pick(s, ["description", "Description"]) || "—";
                    const pct =
                      formatPercent(pick(s, ["percentage", "Percentage"])) ||
                      "—";
                    return (
                      <tr
                        key={getId(s, idx)}
                        className={`shade-row ${
                          hoveredId === getId(s, idx) ? "is-hovered" : ""
                        }`}
                        onMouseEnter={() => setHoveredId(getId(s, idx))}
                        onMouseLeave={() => setHoveredId(null)}
                        onFocus={() => setHoveredId(getId(s, idx))}
                        onBlur={() => setHoveredId(null)}
                        tabIndex={0}
                      >
                        <td className="desc-cell" title={desc}>
                          {desc}
                        </td>
                        <td className="pct-cell">{pct}</td>
                        <td className="del-cell">
                          <button
                            className="table-delete"
                            aria-label="מחק הצללה"
                            title="מחק"
                            onClick={() => handleDeleteShade(s)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EditArea;
