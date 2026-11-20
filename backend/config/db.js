const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Connection Failed:", err.message);
    return;
  }

  console.log("MySQL Connected Successfully!");
});

module.exports = db;
