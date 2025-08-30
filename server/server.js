const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./db'); // Pool של MySQL2

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= אחסון קבצים =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const name = file.originalname.replace(/\s+/g, '_');
    const time = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `${time}-${name}`);
  }
});
const upload = multer({ storage });

// ================= login/register =================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const [results] = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "חובה למלא שם וסיסמה" });

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.json({ success: false, error: "שם המשתמש כבר קיים" });

    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= אזורים =================
app.post('/api/areas/upload', upload.single('path'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!req.file || !name || !description) {
      return res.status(400).json({ error: 'חובה למלא שם, תיאור ולהעלות תמונה.' });
    }
    const filePath = req.file.filename;
    const [result] = await db.query(
      'INSERT INTO areas (name, description, path) VALUES (?, ?, ?)',
      [name, description, filePath]
    );
    res.json({ id: result.insertId, name, description, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/areas', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM areas');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/areas/name/:name', async (req, res) => {
  try {
    const areaName = decodeURIComponent(req.params.name);
    const [results] = await db.query('SELECT * FROM areas WHERE name = ?', [areaName]);
    if (results.length === 0) return res.status(404).json({ error: 'אזור לא נמצא' });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/areas/name/:name', upload.single('path'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const oldName = req.params.name;
    const filePath = req.file ? req.file.filename : null;

    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (description) { fields.push('description = ?'); values.push(description); }
    if (filePath) {
      fields.push('path = ?'); values.push(filePath);
      const [oldFile] = await db.query('SELECT path FROM areas WHERE name = ?', [oldName]);
      if (oldFile[0]?.path) fs.unlink(path.join(__dirname, 'uploads', oldFile[0].path), () => {});
    }

    if (fields.length === 0) return res.status(400).json({ error: 'אין נתונים לעדכון' });
    values.push(oldName);

    await db.query(`UPDATE areas SET ${fields.join(', ')} WHERE name = ?`, values);
    res.json({ message: 'האזור עודכן בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/areas/name/:name', async (req, res) => {
  try {
    const areaName = decodeURIComponent(req.params.name);
    const [area] = await db.query('SELECT id, path FROM areas WHERE name = ?', [areaName]);
    if (!area[0]) return res.status(404).json({ error: 'אזור לא נמצא' });

    if (area[0].path) fs.unlink(path.join(__dirname, 'uploads', area[0].path), () => {});

    await db.query('DELETE FROM shades WHERE Area = ?', [area[0].id]);
    await db.query('DELETE FROM areas WHERE id = ?', [area[0].id]);
    res.json({ message: 'אזור נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= הצללות =================
app.post('/api/shades', async (req, res) => {
  try {
    const { Area, width, height, percentage, description, x, y } = req.body;
    if (!Area || !width || !height || !percentage || !description || x == null || y == null) {
      return res.status(400).json({ error: 'יש למלא את כל השדות: אחוז, תיאור, מיקום וגודל' });
    }

    const [area] = await db.query('SELECT id FROM areas WHERE name = ?', [Area]);
    if (area.length === 0) return res.status(400).json({ error: 'אזור לא נמצא במסד הנתונים' });

    const areaId = area[0].id;
    const [result] = await db.query(
      'INSERT INTO shades (Area, width, height, percentage, description, x, y) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [areaId, width, height, percentage, description, x, y]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shades/:name', async (req, res) => {
  try {
    const areaName = decodeURIComponent(req.params.name);
    const [results] = await db.query(
      `SELECT s.* FROM shades s JOIN areas a ON s.Area = a.id WHERE a.name = ?`,
      [areaName]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shades/:id', async (req, res) => {
  try {
    const { width, height, percentage, description, x, y } = req.body;
    const fields = [];
    const values = [];

    if (width) { fields.push('width = ?'); values.push(width); }
    if (height) { fields.push('height = ?'); values.push(height); }
    if (percentage) { fields.push('percentage = ?'); values.push(percentage); }
    if (description) { fields.push('description = ?'); values.push(description); }
    if (x != null) { fields.push('x = ?'); values.push(x); }
    if (y != null) { fields.push('y = ?'); values.push(y); }

    if (fields.length === 0) return res.status(400).json({ error: 'אין שדות לעדכון' });

    values.push(req.params.id);
    await db.query(`UPDATE shades SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'הצללה עודכנה בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shades/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM shades WHERE id = ?', [req.params.id]);
    res.json({ message: 'הצללה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= הרצת השרת =================
app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
});
