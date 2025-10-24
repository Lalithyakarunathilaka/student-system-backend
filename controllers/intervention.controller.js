const db = require("../config/db");

// optional helper so "term 1" etc. work
function normalizeTerm(t) {
  if (!t) return null;
  const k = String(t).toLowerCase().trim();
  if (["term 1","1st term","first term"].includes(k)) return "First Term";
  if (["term 2","2nd term","second term"].includes(k)) return "Second Term";
  if (["term 3","3rd term","third term"].includes(k)) return "Third Term";
  return t;
}

// ✅ List students in a class with average and a server-side flag
exports.listNeedingSupportByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    let { term, academic_year, year, threshold } = req.query;

    if (!classId) return res.status(400).json({ message: "classId is required" });

    const termNorm = normalizeTerm(term);
    const ay = (academic_year || year || "").trim();
    if (!termNorm || !ay) {
      return res.status(400).json({ message: "term and academic_year are required" });
    }

    const th = Number.isFinite(Number(threshold)) ? Number(threshold) : 50;

    const sql = `
      SELECT 
        u.id AS student_id,
        u.full_name AS student_name,
        ROUND(AVG(m.marks)) AS avg_mark,
        CASE 
          WHEN AVG(m.marks) IS NOT NULL AND AVG(m.marks) < ? THEN 1 
          ELSE 0 
        END AS needs_support
      FROM users u
      LEFT JOIN marks m
        ON m.student_id = u.id
       AND m.term = ?
       AND m.academic_year = ?
      WHERE u.role = 'student'
        AND u.deleted_at IS NULL
        AND u.class_id = ?
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name
    `;

    const [rows] = await db.query(sql, [th, termNorm, ay, classId]);

    // normalize shape for the UI
    const data = rows.map(r => ({
      id: r.student_id,
      name: r.student_name,
      avg_mark: r.avg_mark ?? 0,
      needs_support: !!r.needs_support,
    }));

    res.json(data);
  } catch (err) {
    console.error("❌ listNeedingSupportByClass error:", err);
    res.status(500).json({ message: "Database error", details: err.message });
  }
};

// ✅ Create an intervention
exports.createIntervention = async (req, res) => {
  try {
    const {
      student_id,
      teacher_id,
      class_id,
      term,
      academic_year,
      type,
      details,
      target_date,
    } = req.body;

    if (!student_id || !teacher_id || !details) {
      return res.status(400).json({
        message: "student_id, teacher_id, and details are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO student_interventions
         (student_id, teacher_id, class_id, term, academic_year, type, details, target_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        student_id,
        teacher_id,
        class_id ?? null,
        term ?? null,
        academic_year ?? null,
        type ?? "note",
        details,
        target_date ?? null,
      ]
    );

    res.json({ id: result.insertId, message: "Intervention saved" });
  } catch (e) {
    console.error("createIntervention error:", e);
    res.status(500).json({ message: "Failed to save intervention" });
  }
};

// ✅ List interventions for one student
exports.listForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await db.query(
      `SELECT id, type, details, created_at, teacher_id, class_id, term, academic_year
         FROM student_interventions
        WHERE student_id = ?
        ORDER BY created_at DESC`,
      [studentId]
    );
    res.json(rows);
  } catch (e) {
    console.error("listForStudent error:", e);
    res.status(500).json({ message: "Failed to load interventions" });
  }
};

// student-only: get logged-in student's interventions
exports.listMine = async (req, res) => {
  try {
    const studentId = req.user.id; // comes from JWT
    // (Optional) allow term/year filters
    const { term, academic_year } = req.query;

    const where = ["si.student_id = ?"];
    const params = [studentId];
    if (term) { where.push("si.term = ?"); params.push(term); }
    if (academic_year) { where.push("si.academic_year = ?"); params.push(academic_year); }

    const [rows] = await db.query(
      `
      SELECT 
        si.id,
        si.type,
        si.details,
        si.term,
        si.academic_year,
        si.target_date,
        si.status,
        si.created_at,
        si.updated_at,
        t.full_name AS teacher_name,
        c.name       AS class_name
      FROM student_interventions si
      LEFT JOIN users   t ON t.id = si.teacher_id
      LEFT JOIN classes c ON c.id = si.class_id
      WHERE ${where.join(" AND ")}
      ORDER BY si.created_at DESC
      `,
      params
    );

    res.json(rows);
  } catch (e) {
    console.error("listMine error:", e);
    res.status(500).json({ error: "Database error" });
  }
};