const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    // 1) Fetch user (student only) by email
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password, role, gender, class_id
         FROM users
        WHERE email = ? AND role = 'student' AND deleted_at IS NULL
        LIMIT 1`,
      [email.trim()]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];

    // 2) Verify password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    // 3) (Optional) issue JWT if you want it later
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 4) Optional: class + subjects
    let classData = null;
    let subjects = [];
    if (user.class_id) {
      const [[cls]] = await pool.query(`SELECT id, name, grade FROM classes WHERE id=?`, [
        user.class_id,
      ]);
      classData = cls || null;

      if (classData) {
        const [subs] = await pool.query(
          `SELECT id, subject_name
             FROM subjects
            WHERE class_id = ?`,
          [user.class_id]
        );
        subjects = subs;
      }
    }

    // 5) Return a compact, front-end friendly payload
    return res.json({
      message: "Student login successful",
      token, // if you don’t need tokens yet, you can omit this
      student: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,      // "student"
        gender: user.gender,  // "Female"
        class: classData,     // { id, name, grade } or null
        subjects,             // array
      },
    });
  } catch (err) {
    console.error("MySQL error during student login:", err);
    return res.status(500).json({ error: "Database error" });
  }
};