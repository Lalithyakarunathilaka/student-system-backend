// // controllers/teacherLoginController.js
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const pool = require("../config/db");

// /** POST /api/teacher/login */
// exports.teacherLogin = async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password)
//     return res.status(400).json({ error: "Email and password are required" });

//   try {
//     const [rows] = await pool.query(
//       `SELECT id, full_name, email, password, role, gender
//          FROM users
//         WHERE email = ? AND role = 'teacher' AND deleted_at IS NULL
//         LIMIT 1`,
//       [email.trim()]
//     );

//     if (rows.length === 0)
//       return res.status(401).json({ error: "Invalid email or password" });

//     const user = rows[0];
//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(401).json({ error: "Invalid email or password" });

//     const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     return res.json({
//       message: "Teacher login successful",
//       token,
//       teacher: {
//         id: user.id,
//         name: user.full_name,
//         email: user.email,
//         role: user.role,   // "teacher"
//         gender: user.gender,
//       },
//     });
//   } catch (e) {
//     console.error("teacherLogin error:", e);
//     return res.status(500).json({ error: "Database error" });
//   }
// };

// /** GET /api/teacher/me */
// exports.getMe = async (req, res) => {
//   const { id, role } = req.user;
//   if (role !== "teacher") return res.status(403).json({ error: "Forbidden" });

//   try {
//     const [[t]] = await pool.query(
//       `SELECT id, full_name, email, role, gender
//          FROM users
//         WHERE id = ? AND role = 'teacher' AND deleted_at IS NULL
//         LIMIT 1`,
//       [id]
//     );
//     if (!t) return res.status(404).json({ error: "Teacher not found" });

//     res.json({
//       id: t.id,
//       name: t.full_name,
//       email: t.email,
//       role: t.role,
//       gender: t.gender,
//     });
//   } catch (e) {
//     console.error("getMe error:", e);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// /** GET /api/teacher/my-classes (with students) */
// exports.getMyClassesWithStudents = async (req, res) => {
//   const { id, role } = req.user;
//   if (role !== "teacher") return res.status(403).json({ error: "Forbidden" });

//   try {
//     const [rows] = await pool.query(
//       `
//       SELECT
//         c.id              AS class_id,
//         c.name            AS class_name,
//         s.id              AS student_id,
//         s.full_name       AS student_name,
//         s.email           AS student_email,
//         s.gender          AS student_gender,
//         s.date_of_birth   AS student_dob
//       FROM classes c
//       JOIN users t
//         ON t.id = c.teacher_id AND t.role = 'teacher' AND t.deleted_at IS NULL
//       LEFT JOIN users s
//         ON s.class_id = c.id AND s.role = 'student' AND s.deleted_at IS NULL
//       WHERE c.teacher_id = ?
//       ORDER BY c.name, s.full_name
//       `,
//       [id]
//     );

//     const byClass = new Map();
//     for (const r of rows) {
//       if (!byClass.has(r.class_id)) {
//         byClass.set(r.class_id, { id: r.class_id, name: r.class_name, students: [] });
//       }
//       if (r.student_id) {
//         byClass.get(r.class_id).students.push({
//           id: r.student_id,
//           name: r.student_name,
//           email: r.student_email,
//           gender: r.student_gender,
//           date_of_birth: r.student_dob,
//         });
//       }
//     }

//     res.json({
//       teacher_id: id,
//       classes: Array.from(byClass.values()),
//     });
//   } catch (e) {
//     console.error("getMyClassesWithStudents error:", e);
//     res.status(500).json({ error: "Database error" });
//   }
// };

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

/** Helper to extract teacher from token */
function getTeacherFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // { id, role }
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/** POST /api/teacher/login */
exports.teacherLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password, role, gender
         FROM users
        WHERE email = ? AND role = 'teacher' AND deleted_at IS NULL
        LIMIT 1`,
      [email.trim()]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      message: "Teacher login successful",
      token,
      teacher: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
      },
    });
  } catch (e) {
    console.error("teacherLogin error:", e);
    return res.status(500).json({ error: "Database error" });
  }
};

/** GET /api/teacher/me */
exports.getMe = async (req, res) => {
  try {
    const { id, role } = getTeacherFromToken(req);
    if (role !== "teacher") return res.status(403).json({ error: "Forbidden" });

    const [[t]] = await pool.query(
      `SELECT id, full_name, email, role, gender
         FROM users
        WHERE id = ? AND role = 'teacher' AND deleted_at IS NULL
        LIMIT 1`,
      [id]
    );
    if (!t) return res.status(404).json({ error: "Teacher not found" });

    res.json({
      id: t.id,
      name: t.full_name,
      email: t.email,
      role: t.role,
      gender: t.gender,
    });
  } catch (e) {
    console.error("getMe error:", e.message);
    res.status(401).json({ error: e.message });
  }
};

/** GET /api/teacher/my-classes (with students) */
exports.getMyClassesWithStudents = async (req, res) => {
  try {
    const { id, role } = getTeacherFromToken(req);
    if (role !== "teacher") return res.status(403).json({ error: "Forbidden" });

    const [rows] = await pool.query(
      `
      SELECT
        c.id              AS class_id,
        c.name            AS class_name,
        s.id              AS student_id,
        s.full_name       AS student_name,
        s.email           AS student_email,
        s.gender          AS student_gender,
        s.date_of_birth   AS student_dob
      FROM classes c
      JOIN users t
        ON t.id = c.teacher_id AND t.role = 'teacher' AND t.deleted_at IS NULL
      LEFT JOIN users s
        ON s.class_id = c.id AND s.role = 'student' AND s.deleted_at IS NULL
      WHERE c.teacher_id = ?
      ORDER BY c.name, s.full_name
      `,
      [id]
    );

    const byClass = new Map();
    for (const r of rows) {
      if (!byClass.has(r.class_id)) {
        byClass.set(r.class_id, { id: r.class_id, name: r.class_name, students: [] });
      }
      if (r.student_id) {
        byClass.get(r.class_id).students.push({
          id: r.student_id,
          name: r.student_name,
          email: r.student_email,
          gender: r.student_gender,
          date_of_birth: r.student_dob,
        });
      }
    }

    res.json({
      teacher_id: id,
      classes: Array.from(byClass.values()),
    });
  } catch (e) {
    console.error("getMyClassesWithStudents error:", e.message);
    res.status(401).json({ error: e.message });
  }
};
