// controllers/auth.controller.js (or studentLoginController.js)
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const ASSIGN_TABLE = "class_subject_teacher";

// Parse "10-A", "10A", or "10 - A" → { grade: 10, class_name: "A" }
function parseGradeClass(name) {
  if (!name) return null;
  const m = String(name).trim().match(/^(\d+)\s*[- ]?\s*([A-Za-z])$/);
  return m ? { grade: Number(m[1]), class_name: m[2].toUpperCase() } : null;
}

exports.studentLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    // 1) Find student by email
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password, role, gender, class_id
         FROM users
        WHERE email = ? AND role = 'student' AND deleted_at IS NULL
        LIMIT 1`,
      [email.trim()]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];

    // 2) Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    // 3) Issue token (optional)
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 4) Class + subjects
    let classData = null;
    let subjects = [];

    if (user.class_id) {
      // ✅ classes table has only id, name, teacher_id, timestamps
      const [[cls]] = await pool.query(
        `SELECT id, name FROM classes WHERE id = ? LIMIT 1`,
        [user.class_id]
      );
      classData = cls || null;

      // Derive grade/section from classes.name like "10-A"
      const parsed = parseGradeClass(cls?.name);

      if (parsed) {
        // Get subjects from class_subject_teacher → subjects (and teacher’s name if you want)
        const [subs] = await pool.query(
          `SELECT 
              cst.subject_id      AS id,
              s.name              AS subject_name,
              cst.grade,
              cst.class_name,
              cst.teacher_id,
              u.full_name         AS teacher_name
           FROM ${ASSIGN_TABLE} cst
           JOIN subjects s   ON s.id = cst.subject_id
      LEFT JOIN users u     ON u.id = cst.teacher_id
          WHERE cst.grade = ? AND cst.class_name = ?
          ORDER BY s.name`,
          [parsed.grade, parsed.class_name]
        );
        subjects = subs;
      } else {
        // If class name doesn't match "10-A", we can't derive grade/section:
        subjects = []; // or fallback to an all-grade list if that’s desired
      }
    }

    // 5) Respond
    return res.json({
      message: "Student login successful",
      token, // optional
      student: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,     // "student"
        gender: user.gender,
        class: classData,    // { id, name } or null
        subjects,            // [{ id, subject_name, grade, class_name, teacher_id, teacher_name }]
      },
    });
  } catch (err) {
    console.error("MySQL error during student login:", err);
    return res.status(500).json({ error: "Database error" });
  }
};
