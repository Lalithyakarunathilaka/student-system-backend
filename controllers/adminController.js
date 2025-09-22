const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// POST /api/admin/register
exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });

  try {
    const [rows] = await pool.query("SELECT id FROM admin WHERE email = ?", [email]);
    if (rows.length) return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO admin (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hash,
    ]);

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// POST /api/admin/login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const [rows] = await pool.query("SELECT id, name, email, password FROM admin WHERE email = ?", [
      email,
    ]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  
    const token = jwt.sign({ id: admin.id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: "admin" },
    });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /api/admin/stats  
exports.getStats = async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS count FROM users");
    const [[students]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role='student'");
    const [[teachers]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role='teacher'");
    const [[classes]] = await pool.query("SELECT COUNT(*) AS count FROM classes");

    res.json({
      users: users.count,
      students: students.count,
      teachers: teachers.count,
      classes: classes.count,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
