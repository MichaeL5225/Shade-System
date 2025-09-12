import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditArea.css";

const TrashIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm6 2V4H9v1h6ZM7 7v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H7Zm3 3a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0v-8Zm4 0a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0v-8Z"/>
  </svg>
);

function EditArea() {
  const { name } = useParams();
  const [areaData, setAreaData] = useState({
    name: "",
    description: "",
    path: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editableShades, setEditableShades] = useState([]);
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
  const navigate = useNavigate();
  const handleBack = () => {
    // אם יש היסטוריה – חזרה צעד אחד; אחרת לנווט לרשימת האזורים (עמוד הבית)
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

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

  const startEdit = () => {
    setEditMode(true);
    setEditableShades(shades.map(s => ({ ...s })));
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditableShades([]);
  };

  const handleAreaField = (key, value) => {
    setAreaData(prev => ({ ...prev, [key]: value }));
  };

  const handleShadeField = (idx, key, value) => {
    setEditableShades(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: key === "percentage" ? String(value).replace(/[^\d]/g, "") : value };
      return next;
    });
  };

  const saveEdit = async () => {
    try {
      // 1) עדכון פרטי האזור (שם/תיאור)
      const areaPayload = { name: areaData.name, description: areaData.description };
      await axios.put(`/api/areas/name/${encodeURIComponent(name)}`, areaPayload);

      // 2) עדכון הצללות ששונו בלבד (שם=description, אחוז=percentage)
      const byId = new Map(shades.map((s, i) => [getId(s, i), s]));
      for (let i = 0; i < editableShades.length; i++) {
        const cur  = editableShades[i];
        const id   = getId(cur, i);
        const orig = byId.get(id);
        if (!orig) continue;
        const next = {};
        const curPct  = cur.percentage ?? cur.Percentage ?? cur.percent;
        const origPct = orig.percentage ?? orig.Percentage ?? orig.percent;
        const curDesc  = cur.description ?? cur.Description ?? "";
        const origDesc = orig.description ?? orig.Description ?? "";
        if (String(curPct ?? "") !== String(origPct ?? "")) next.percentage = Number(curPct) || 0;
        if (curDesc !== origDesc) next.description = curDesc;
        if (Object.keys(next).length > 0) {
          await axios.put(`/api/shades/${id}`, next);
        }
      }

      // 3) רענון נתונים וסיום עריכה
      const updatedArea   = await axios.get(`/api/areas/name/${encodeURIComponent(areaData.name)}`);
      setAreaData(updatedArea.data);
      const updatedShades = await axios.get(`/api/shades/${encodeURIComponent(areaData.name)}`);
      setShades(updatedShades.data);
      setEditMode(false);
    } catch (err) {
      console.error("שגיאה בשמירת עריכה:", err);
      alert("❌ שמירה נכשלה");
    }
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

  const displayShades = editMode ? editableShades : shades;

  return (
    <div className="edit-area">

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

            {displayShades.map((shade, i) => (
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

                {/* עיגול לבן שמתמלא אפור לפי אחוז ההצללה */}
                {(() => {
                  const raw = pick(shade, ["percentage", "Percentage", "percent"]);
                  const pct = Math.max(0, Math.min(100, Number(raw) || 0));
                  return <div className="shade-dot" style={{ "--pct": pct }} />;
                })()}
                <button
                  className="shade-delete"
                  aria-label="מחק הצללה"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteShade(shade);
                  }}
                  title="מחק"
                >
                  <span className="trash-red"><TrashIcon size={14} /></span>
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
                 <div className="shade-dot" style={{ "--pct": Number(newShade.percentage) || 0 }} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SHADES TABLE (single instance) */}
        <aside className="shade-panel" aria-label="טבלת הצללות">
          {/* פרטי אזור + מצב עריכה */}
          {editMode ? (
            <>
              <label className="field-label">שם האזור</label>
              <input
                className="shade-input"
                value={areaData.name}
                onChange={(e) => handleAreaField("name", e.target.value)}
              />
              <label className="field-label">תיאור האזור</label>
              <textarea
                className="shade-input"
                rows={3}
                value={areaData.description}
                onChange={(e) => handleAreaField("description", e.target.value)}
              />
              <div className="panel-actions">
                <button className="button" onClick={saveEdit}> שמור</button>
                <button className="button" onClick={cancelEdit}>בטל</button>
             </div>
           </>
          ) : (
            <>
              <div className="panel-area-info">
                <h2 className="panel-area-title">{areaData.name}</h2>
                <p className="panel-area-desc">{areaData.description}</p>
              </div>
              {!isAdding && (
                <div className="panel-actions">
                  <button className="button button-primary" onClick={startEdit}> עריכת אזור</button>
                  <button className="button button-primary" onClick={handleToggleAdd}> הוספת הצללה</button>
                </div>
              )}
            </>
          )}

          {/* טופס הוספת הצללה – בתוך הפאנל ובראשו (דביק) */}
          {isAdding && (
            <div className="panel-sticky">
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
                <button className="button" onClick={handleSaveShade}> שמור </button>
                <button className="button" onClick={handleToggleAdd}> בטל</button>
              </div>
            </div>
          )}

          <div className="panel-card">
            <div className="panel-header">
              <h3>הצללות</h3>
            </div>
            <div className="panel-subtitle">
              מספר ההצללות באזור – {(editMode ? editableShades.length : shades.length)}
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
                  {(editMode ? editableShades : shades).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="empty-row">
                        אין הצללות להצגה
                      </td>
                    </tr>
                  ) : (
                    (editMode ? editableShades : shades).map((s, idx) => {
                      const desc = pick(s, ["description", "Description"]) ?? "";
                      const pct  = pick(s, ["percentage", "Percentage"]);
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
                            {editMode ? (
                              <input
                                className="shade-input"
                                value={desc}
                                onChange={(e) =>
                                  handleShadeField(idx, "description", e.target.value)
                                }
                              />
                            ) : (
                              desc || "—"
                            )}
                          </td>
                          <td className="pct-cell">
                            {editMode ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="percent-input"
                                value={pct ?? ""}
                                onChange={(e) =>
                                  handleShadeField(idx, "percentage", e.target.value)
                                }
                              />
                            ) : (
                              formatPercent(pct) || "—"
                            )}
                          </td>
                          <td className="del-cell">
                            <button
                              className="table-delete"
                              aria-label="מחק הצללה"
                              title="מחק"
                              onClick={() => handleDeleteShade(s)}
                              disabled={editMode}
                            >
                              <span className="trash-red"><TrashIcon /></span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* כפתור חזרה – מתחת לטבלה */}
          <div className="panel-footer">
            <button className="button" onClick={handleBack}> חזרה</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EditArea;
