const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

exports.teacherLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check user by email
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Must be a teacher
    if (user.role !== "teacher") {
      return res.status(403).json({ error: "You must use a teacher account to login" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Fetch teacher’s assigned classes (from classes table)
    const [classes] = await pool.query(
      "SELECT id, name FROM classes WHERE teacher_id = ?",
      [user.id]
    );

    res.json({
      message: "Teacher login successful",
      token,
      teacher: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        classes, // array of class objects
      },
    });
  } catch (error) {
    console.error("MySQL error during teacher login:", error);
    res.status(500).json({ error: "Database error" });
  }
};
