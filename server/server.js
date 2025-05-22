// ייבוא ספריות
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./db'); // קובץ שמבצע את החיבור ל-MySQL

// יצירת שרת Express
const app = express();
const PORT = 5000;

// אמצעים נוספים
app.use(cors());
app.use(express.json());

// משרת קבצים סטטיים מתוך תיקיית uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// יצירת תיקייה לאחסון קבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // שמירת הקובץ בתיקייה uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // סיומת מקורית של הקובץ
    cb(null, Date.now() + ext); // יצירת שם חדש על בסיס הזמן
  },
});

const upload = multer({ storage });

// יצירת אזור חדש עם תמונה
app.post('/api/areas/upload', upload.single('image'), (req, res) => {
  const { name, description } = req.body;

  // בדיקה: חייבים שם, תיאור וקובץ תמונה
  if (!req.file || !name || !description) {
    return res.status(400).json({ error: 'חובה למלא שם, תיאור ולהעלות תמונה.' });
  }

  const image = req.file.filename;

  db.query(
    'INSERT INTO areas (name, description, image) VALUES (?, ?, ?)',
    [name, description, image],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // החזרת הנתונים כולל הנתיב לתמונה
      res.json({ id: result.insertId, name, description, image });
    }
  );
});

// קבלת כל האזורים הקיימים
app.get('/api/areas', (req, res) => {
  db.query('SELECT name FROM areas', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
});
