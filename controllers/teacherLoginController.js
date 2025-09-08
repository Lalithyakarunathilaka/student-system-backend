const pool = require("../config/db");

// Teacher Login
exports.teacherLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.role !== "teacher") {
      return res.status(403).json({ error: "You must use a teacher account to login" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Later you can generate a real JWT here
    res.json({
      message: "Teacher login successful",
      token: "fake-jwt-token",
      teacher: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("MySQL error during teacher login:", error);
    res.status(500).json({ error: "Database error" });
  }
};
