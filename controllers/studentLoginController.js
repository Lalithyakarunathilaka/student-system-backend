const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find student by email
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Must be student
    if (user.role !== "student") {
      return res.status(403).json({ error: "You must use a student account to login" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Fetch student's class
    let classData = null;
    let subjects = [];

    if (user.class_id) {
      const [classRows] = await pool.query("SELECT * FROM classes WHERE id = ?", [user.class_id]);
      classData = classRows.length ? classRows[0] : null;

      if (classData) {
        const [subjectRows] = await pool.query(
          "SELECT * FROM subjects WHERE class_id = ?",
          [user.class_id]
        );
        subjects = subjectRows;
      }
    }

    res.json({
      message: "Student login successful",
      token,
      student: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        class: classData,
        subjects,
      },
    });
  } catch (error) {
    console.error("MySQL error during student login:", error);
    res.status(500).json({ error: "Database error" });
  }
};
