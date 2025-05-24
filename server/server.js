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

// יצירת תיקייה לאחסון קבצים עם שם ברור וקריא
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname.replace(/\s+/g, '_'); // מחיקת רווחים
    const now = new Date();
    const timestamp =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');

    cb(null, `${timestamp}-${originalName}`);
  },
});

const upload = multer({ storage });

// יצירת אזור חדש עם תמונה
app.post('/api/areas/upload', upload.single('path'), (req, res) => {
  const { name, description } = req.body;

  // בדיקה: חייבים שם, תיאור וקובץ תמונה
  if (!req.file || !name || !description) {
    return res.status(400).json({ error: 'חובה למלא שם, תיאור ולהעלות תמונה.' });
  }

  const filePath = req.file.filename;

  db.query(
    'INSERT INTO areas (name, description, path) VALUES (?, ?, ?)',
    [name, description, filePath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      // החזרת הנתונים כולל הנתיב לקובץ
      res.json({ id: result.insertId, name, description, path: filePath });
    }
  );
});

// קבלת כל האזורים הקיימים
app.get('/api/areas', (req, res) => {
  db.query('SELECT * FROM areas', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
// מחיקת אזור לפי שם
app.delete('/api/areas/name/:name', (req, res) => {
  const areaName = decodeURIComponent(req.params.name);
  const getImagePathQuery = 'SELECT path FROM areas WHERE name = ?';
  db.query(getImagePathQuery, [areaName], (err, results) => {
    if (err) {
      console.error('שגיאה בשליפת נתיב התמונה:', err);
      return res.status(500).json({ error: 'שגיאה בשליפת נתיב התמונה' });
    }
    if (results.length > 0 && results[0].path) {
      const imagePath = path.join(__dirname, 'uploads', results[0].path);
      // נסה למחוק את הקובץ, התעלם משגיאות (למשל אם לא קיים)
      require('fs').unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('שגיאה במחיקת קובץ התמונה:', err);
        }
      });
    }
  });
  console.log('מנסים למחוק:', areaName);

  // קודם למחוק רשומות תלויות ב-shades
  const deleteShadesQuery = `
    DELETE s FROM shades s
    JOIN areas a ON s.Area = a.id
    WHERE a.name = ?`;

  db.query(deleteShadesQuery, [areaName], (err, result) => {
    if (err) {
      console.error('שגיאה במחיקת shades:', err);
      return res.status(500).json({ error: 'שגיאה במחיקת shades' });
    }

    // אחרי שמחקנו את התלויות, מוחקים את האזור עצמו
    db.query(
      'DELETE FROM areas WHERE name = ?',
      [areaName],
      (err, result) => {
        if (err) {
          console.error('שגיאה במחיקה:', err);
          return res.status(500).json({ error: 'שגיאה במחיקה' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'אזור לא נמצא' });
        }

        res.json({ message: 'אזור נמחק בהצלחה' });
      }
    );
  });
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
});
