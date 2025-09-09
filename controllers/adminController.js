const pool = require("../config/db");

// Register Admin
exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT id FROM admin WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ error: "Email already registered" });

    await pool.query(
      "INSERT INTO admin(name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM admin WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", token: "fake-jwt-token" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Admin Stats
exports.getStats = async (req, res) => {
  try {
    // Total Users
    const [users] = await pool.query("SELECT COUNT(*) AS count FROM users");

    // Total Students
    const [students] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
    );

    // Total Teachers
    const [teachers] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'"
    );

    // Total Classes
    const [classes] = await pool.query("SELECT COUNT(*) AS count FROM classes");

    res.json({
      users: users[0].count,
      students: students[0].count,
      teachers: teachers[0].count,
      classes: classes[0].count,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
