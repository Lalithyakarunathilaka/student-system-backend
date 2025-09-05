const pool = require("../config/db");

// Register User (Admin adds user)
exports.addUser = async (req, res) => {
  const { fullName, email, password, role, grade, gender } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await pool.query(
      "INSERT INTO users (full_name, email, password, role, grade, gender) VALUES (?, ?, ?, ?, ?, ?)",
      [fullName, email, password, role, grade || null, gender || null]
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get all users (optionally by role)
exports.getUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let sql = "SELECT id, full_name, email, role, grade, gender FROM users";
    const params = [];

    if (role) {
      sql += " WHERE role = ?";
      params.push(role);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
