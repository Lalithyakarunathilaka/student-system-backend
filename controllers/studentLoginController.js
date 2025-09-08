const pool = require("../config/db");

// Student Login
exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.role !== "student") {
      return res.status(403).json({ error: "You must use a student account to login" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ message: "Student login successful", token: "fake-jwt-token" });
  } catch (error) {
    console.error("MySQL error during student login:", error);
    res.status(500).json({ error: "Database error" });
  }
};
