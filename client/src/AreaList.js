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

  // ===== RBAC =====
  const role = Number(localStorage.getItem('shade_role') || 2);
  const isAdmin = role === 1;

  // ===== USERS PANEL (מצבים) =====
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [users, setUsers] = useState([]);
  const [editableUsers, setEditableUsers] = useState([]);
  const [usersEditMode, setUsersEditMode] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem('shade_username') || '');
  }, []);

  useEffect(() => {
    axios.get('/api/areas')
      .then(res => setAreas(res.data))
      .catch(err => console.error('שגיאה בקבלת אזורים:', err));
  }, []);

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const toggleForm = () => {
    if (!isAdmin) { alert('אין הרשאה להוסיף אזור'); return; }
    setShowForm(!showForm);
  };

  const handleAddArea = () => {
    if (!isAdmin) { alert('אין הרשאה לבצע פעולה זו'); return; }
    const { name, description } = newArea;
    if (!name || !description || !pathFile)
      return alert('חובה למלא את כל השדות ולהעלות תמונה');

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
    if (!isAdmin) { alert('אין הרשאה למחיקה'); return; }
    Promise.all(
      selectedAreas.map(name =>
        axios.delete(`/api/areas/name/${encodeURIComponent(name)}`)
      )
    )
      .then(() => {
        setAreas(areas.filter(area => !selectedAreas.includes(area.name)));
        setSelectedAreas([]);
        setDeleteMode(false);
      })
      .catch(err => console.error('שגיאה במחיקה:', err));
  };

  const handleDeleteSingle = async (name) => {
    if (!isAdmin) { alert('אין הרשאה למחיקה'); return; }
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

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setPathFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      setLoadingUsers(true);
      const { data } = await axios.get('/api/users');
      setUsers(Array.isArray(data) ? data : []);
      if (usersEditMode) setEditableUsers(Array.isArray(data) ? data.map(u => ({ ...u })) : []);
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUsersPanel = async () => {
    if (!isAdmin) return;
    const next = !showUsersPanel;
    setShowUsersPanel(next);
    if (next) {
      setUsersEditMode(false);
      await loadUsers();
    }
  };

  const enterUsersEdit = () => {
    if (!isAdmin) return;
    setEditableUsers(users.map(u => ({ ...u })));
    setUsersEditMode(true);
  };

  const cancelUsersEdit = () => {
    setUsersEditMode(false);
    setEditableUsers([]);
  };

  const updateEditableUserField = (id, field, value) => {
    setEditableUsers(prev => prev.map(u => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const saveAllUsers = async () => {
    if (!isAdmin || !usersEditMode) return;
    try {
      setSavingUsers(true);

      const updates = [];
      for (let i = 0; i < editableUsers.length; i++) {
        const cur = editableUsers[i];
        const orig = users.find(u => u.id === cur.id);
        if (!orig) continue;

        const payload = {};
        if (Number(cur.role) !== Number(orig.role)) payload.role = Number(cur.role);
        if (Object.keys(payload).length) updates.push({ id: cur.id, payload });
      }

      if (updates.length === 0) {
        alert('אין שינויים לשמירה');
        return;
      }

      for (const u of updates) {
        await axios.put(`/api/users/${u.id}`, u.payload);
      }

      alert('נשמר בהצלחה');
      setUsersEditMode(false);
      setEditableUsers([]);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setSavingUsers(false);
    }
  };

  const deleteUser = async (id) => {
    if (!isAdmin) return;
    const ok = window.confirm('למחוק משתמש זה?');
    if (!ok) return;
    try {
      await axios.delete(`/api/users/${id}`);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  };

  return (
    <div
      className="App"
      style={{
        backgroundImage: "url('/HIT.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh"
      }}
    >
      {!(isAdmin && showUsersPanel) && (
        <div className="welcome-strip">
          <div className="welcome-inner">
            ברוך הבא{username ? `, ${username}` : ''}
          </div>
        </div>
    )}

      {!showForm && (
        <section className="hero">
          <div className={`hero-card${showUsersPanel ? ' users-mode' : ''}`}>
            <h1 className="hero-title">ניהול אזורי קמפוס</h1>

            {isAdmin && showUsersPanel && (
              <h2 className="users-subtitle">טבלת משתמשים</h2>
            )}

            <div className="hero-actions" style={{ width: '100%' }}>
              {!isAdmin || !showUsersPanel ? (
                <>
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

                          {isAdmin && (
                            <button
                              type="button"
                              className="trash-icon-btn"
                              title={`מחיקת האזור "${area.name}"`}
                              aria-label={`מחיקת האזור ${area.name}`}
                              onClick={() => handleDeleteSingle(area.name)}
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    {isAdmin && deleteMode && selectedAreas.length > 0 && (
                      <div className="panel-actions">
                        <button className="btn delete small" onClick={handleDeleteSelected}>
                          🗑 מחיקת נבחרים ({selectedAreas.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && !showUsersPanel && (
                    <div className="actions-row actions-row--bottom" style={{ gap: 12, flexWrap: 'wrap' }}>
                      <button className="btn-hero btn-primary" onClick={toggleUsersPanel}>משתמשים</button>
                      <button className="btn-hero btn-primary" onClick={toggleForm}>הוספת אזור</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <div className="admin-users-panel admin-users-panel--lg">
                    {users.length === 0 ? (
                      <div className="empty-state">אין משתמשים להצגה.</div>
                    ) : (
                      <div className="users-table-wrap">
                        <table className="users-table users-table--lg">
                          <thead>
                            <tr>
                              <th className="col-id">ID</th>
                              <th className="col-username">Username</th>
                              <th className="col-email">Email</th>
                              <th className="col-phone">Phone</th>
                              <th className="col-role">Role</th>
                              <th className="col-trash"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(usersEditMode ? editableUsers : users).map(u => (
                              <tr key={u.id}>
                                <td className="col-id">{u.id}</td>
                                <td className="col-username">{u.username}</td>
                                <td className="col-email">{u.email || ''}</td>
                                <td className="col-phone">{u.phone || ''}</td>
                                <td className="col-role">
                                  <select
                                    value={Number(usersEditMode ? u.role : u.role) || 2}
                                    onChange={(e) => updateEditableUserField(u.id, 'role', Number(e.target.value))}
                                    disabled={!usersEditMode}
                                  >
                                    <option value={1}>1 (Admin)</option>
                                    <option value={2}>2 (Viewer)</option>
                                  </select>
                                </td>
                                <td className="col-trash">
                                  <button
                                    className="trash-icon-btn red"
                                    title="מחיקת משתמש"
                                    onClick={() => deleteUser(u.id)}
                                  >
                                    🗑
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className={`users-cta-row users-cta-row--compact ${usersEditMode ? 'editing' : ''}`}>
                    <button
                      className="btn-hero btn-primary btn-hero--users"
                      onClick={loadUsers}
                      disabled={loadingUsers}
                    >
                      {loadingUsers ? 'טוען...' : 'רענן'}
                    </button>

                    {!usersEditMode ? (
                      <>
                        <button
                          className="btn-hero btn-primary btn-hero--users"
                          onClick={enterUsersEdit}
                          disabled={loadingUsers || users.length === 0}
                        >
                          עריכה
                        </button>
                        <button
                          className="btn back-btn btn-hero--users"
                          onClick={() => {
                            setUsersEditMode(false);
                            setEditableUsers([]);
                            setShowUsersPanel(false);
                          }}
                        >
                          חזרה
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-hero btn-primary btn-hero--users"
                          onClick={saveAllUsers}
                          disabled={savingUsers}
                        >
                          {savingUsers ? 'שומר...' : 'שמור'}
                        </button>
                        <button
                          className="btn-hero btn-primary btn-hero--users"
                          onClick={cancelUsersEdit}
                          disabled={savingUsers}
                        >
                          בטל
                        </button>
                        <button
                          className="btn back-btn btn-hero--users"
                          onClick={() => {
                            setUsersEditMode(false);
                            setEditableUsers([]);
                            setShowUsersPanel(false);
                          }}
                        >
                          חזרה
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
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
              disabled={!isAdmin}
            />
            <textarea
              placeholder="תיאור האזור"
              value={newArea.description}
              onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
              disabled={!isAdmin}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={!isAdmin}
            />

            {isAdmin && pathFile && (
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
              → חזרה
            </button>

            {isAdmin && (
              <button
                className="btn submit-btn"
                onClick={handleAddArea}
              >
                הוסף
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AreaList;
