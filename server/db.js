const mysql = require("mysql2/promise"); // חשוב להשתמש ב-promise

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "amit36521",
  database: "shade_system_db",
  waitForConnections: true,
  connectionLimit: 10, // מספר חיבורים בו זמנית
  queueLimit: 0,
});

module.exports = pool;
