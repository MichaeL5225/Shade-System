const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//delete after test
/*app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});*/

app.get("/health", (_req, res) => res.send("ok"));

// הגדרות אחסון קבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const name = file.originalname.replace(/\s+/g, "_");
    const time = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `${time}-${name}`);
  },
});
const upload = multer({ storage });

// ================= אזורים =================

app.post("/api/areas/upload", upload.single("path"), (req, res) => {
  const { name, description } = req.body;
  if (!req.file || !name || !description) {
    return res
      .status(400)
      .json({ error: "חובה למלא שם, תיאור ולהעלות תמונה." });
  }

  const filePath = req.file.filename;
  db.query(
    "INSERT INTO areas (name, description, path) VALUES (?, ?, ?)",
    [name, description, filePath],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, name, description, path: filePath });
    }
  );
});

app.get("/api/areas", (req, res) => {
  db.query("SELECT * FROM areas", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/api/areas/name/:name", (req, res) => {
  const areaName = decodeURIComponent(req.params.name);
  db.query("SELECT * FROM areas WHERE name = ?", [areaName], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "אזור לא נמצא" });
    res.json(results[0]);
  });
});

app.put("/api/areas/name/:name", upload.single("path"), (req, res) => {
  const { name, description } = req.body;
  const oldName = req.params.name;
  const filePath = req.file ? req.file.filename : null;

  const fields = [];
  const values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }
  if (description) {
    fields.push("description = ?");
    values.push(description);
  }
  if (filePath) {
    fields.push("path = ?");
    values.push(filePath);
    db.query(
      "SELECT path FROM areas WHERE name = ?",
      [oldName],
      (err, results) => {
        if (results?.[0]?.path) {
          fs.unlink(path.join(__dirname, "uploads", results[0].path), () => {});
        }
      }
    );
  }

  if (fields.length === 0)
    return res.status(400).json({ error: "אין נתונים לעדכון" });

  values.push(oldName);
  db.query(
    `UPDATE areas SET ${fields.join(", ")} WHERE name = ?`,
    values,
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "האזור עודכן בהצלחה" });
    }
  );
});

app.delete("/api/areas/name/:name", (req, res) => {
  const areaName = decodeURIComponent(req.params.name);

  db.query(
    "SELECT path FROM areas WHERE name = ?",
    [areaName],
    (err, results) => {
      if (!err && results[0]?.path) {
        fs.unlink(path.join(__dirname, "uploads", results[0].path), () => {});
      }
    }
  );

  db.query(
    "DELETE FROM shades WHERE Area = (SELECT id FROM areas WHERE name = ?)",
    [areaName]
  );
  db.query("DELETE FROM areas WHERE name = ?", [areaName], (err, result) => {
    if (err) return res.status(500).json({ error: "שגיאה במחיקת האזור" });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "אזור לא נמצא" });
    res.json({ message: "אזור נמחק בהצלחה" });
  });
});

// ================= הצללות =================

// ✅ שמירת הצללה לפי שם אזור
app.post("/api/shades", (req, res) => {
  const { Area, width, height, percentage, description, x, y } = req.body;

  if (
    !Area ||
    !width ||
    !height ||
    !percentage ||
    !description ||
    x == null ||
    y == null
  ) {
    return res
      .status(400)
      .json({ error: "יש למלא את כל השדות: אחוז, תיאור, מיקום וגודל" });
  }

  const getAreaIdQuery = "SELECT id FROM areas WHERE name = ?";

  db.query(getAreaIdQuery, [Area], (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בבדיקת שם אזור" });
    if (results.length === 0)
      return res.status(400).json({ error: "אזור לא נמצא במסד הנתונים" });

    const areaId = results[0].id;

    const insertQuery = `
      INSERT INTO shades (Area, width, height, percentage, description, x, y)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [areaId, width, height, percentage, description, x, y],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId });
      }
    );
  });
});

app.get("/api/shades/:name", (req, res) => {
  const areaName = decodeURIComponent(req.params.name);
  const sql = `
    SELECT s.* FROM shades s
    JOIN areas a ON s.Area = a.id
    WHERE a.name = ?
  `;
  db.query(sql, [areaName], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put("/api/shades/:id", (req, res) => {
  const { width, height, percentage, description, x, y } = req.body;
  const fields = [];
  const values = [];

  if (width) {
    fields.push("width = ?");
    values.push(width);
  }
  if (height) {
    fields.push("height = ?");
    values.push(height);
  }
  if (percentage) {
    fields.push("percentage = ?");
    values.push(percentage);
  }
  if (description) {
    fields.push("description = ?");
    values.push(description);
  }
  if (x != null) {
    fields.push("x = ?");
    values.push(x);
  }
  if (y != null) {
    fields.push("y = ?");
    values.push(y);
  }

  if (fields.length === 0)
    return res.status(400).json({ error: "אין שדות לעדכון" });

  values.push(req.params.id);
  db.query(
    `UPDATE shades SET ${fields.join(", ")} WHERE id = ?`,
    values,
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "הצללה עודכנה בהצלחה" });
    }
  );
});

app.delete("/api/shades/:id", (req, res) => {
  db.query("DELETE FROM shades WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "הצללה נמחקה בהצלחה" });
  });
});

// ================= הרצת השרת =================

app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
});
