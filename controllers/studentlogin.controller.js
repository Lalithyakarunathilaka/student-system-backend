// controllers/auth.controller.js (or studentLoginController.js)
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const ASSIGN_TABLE = "class_subject_teacher";


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
    // Find student by email
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

    //Check password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    //Issue token 
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    let classData = null;
    let subjects = [];

    if (user.class_id) {
      
      const [[cls]] = await pool.query(
        `SELECT id, name FROM classes WHERE id = ? LIMIT 1`,
        [user.class_id]
      );
      classData = cls || null;

      // Derive grade/section from classes.name 
      const parsed = parseGradeClass(cls?.name);

      if (parsed) {
        // Get subjects from class_subject_teacher table
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
        
        subjects = []; 
      }
    }

    return res.json({
      message: "Student login successful",
      token, // optional
      student: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,     
        gender: user.gender,
        class: classData,    
        subjects,            
      },
    });
  } catch (err) {
    console.error("MySQL error during student login:", err);
    return res.status(500).json({ error: "Database error" });
  }
};
