const pool = require("../config/db");

// --- Normalize term strings to a consistent value ---
function normalizeTerm(t) {
  if (!t) return null;
  const k = String(t).toLowerCase().trim();
  if (["term 1", "1st term", "first term"].includes(k)) return "First Term";
  if (["term 2", "2nd term", "second term"].includes(k)) return "Second Term";
  if (["term 3", "3rd term", "third term"].includes(k)) return "Third Term";
  return t;
}

exports.getStudentsOverall = async (req, res) => {
  try {
    const {
      grade,
      class: classLetter,
      subject_id,
      subject,
      term,
      academic_year,
    } = req.query;

    const termNorm = normalizeTerm(term);

    // 🧩 WHERE clause for students
    const whereStudent = [`u.role = 'student'`, `u.deleted_at IS NULL`];
    const paramsStudent = [];

    if (grade) {
      whereStudent.push(
        `CAST(SUBSTRING_INDEX(c.name, '-', 1) AS UNSIGNED) = ?`
      );
      paramsStudent.push(Number(grade));
    }

    if (classLetter && classLetter !== "All") {
      whereStudent.push(`UPPER(SUBSTRING_INDEX(c.name, '-', -1)) = ?`);
      paramsStudent.push(String(classLetter).toUpperCase());
    }

    // 🧩 WHERE clause for marks join
    const whereMarks = [];
    const paramsMarks = [];

    if (subject_id) {
      whereMarks.push(`m.subject_id = ?`);
      paramsMarks.push(Number(subject_id));
    } else if (subject) {
      // ✅ FIX: use safe subquery to avoid invalid SQL when subject not found
      whereMarks.push(`
        m.subject_id = (
          SELECT id FROM subjects 
          WHERE LOWER(name) = LOWER(?) 
          LIMIT 1
        )
      `);
      paramsMarks.push(subject);
    }

    if (termNorm) {
      whereMarks.push(`m.term = ?`);
      paramsMarks.push(termNorm);
    }

    if (academic_year) {
      whereMarks.push(`m.academic_year = ?`);
      paramsMarks.push(academic_year);
    }

    // ✅ FIX: only include marksFilterSql *after* LEFT JOIN subjects
    const marksFilterSql = whereMarks.length
      ? `AND ${whereMarks.join(" AND ")}`
      : "";

    // --- MAIN QUERY ---
    const sql = `
      SELECT
        u.id AS student_id,
        u.full_name AS student_name,
        c.name AS class_name,
        s.id AS subj_id,
        s.name AS subject_name,
        m.term AS term_name,
        m.marks AS mark_value
      FROM users u
      JOIN classes c ON c.id = u.class_id
      LEFT JOIN marks m ON m.student_id = u.id
      LEFT JOIN subjects s ON s.id = m.subject_id
      ${marksFilterSql}
      WHERE ${whereStudent.join(" AND ")}
      ORDER BY
        CAST(SUBSTRING_INDEX(c.name, '-', 1) AS UNSIGNED),
        UPPER(SUBSTRING_INDEX(c.name, '-', -1)),
        u.full_name, s.name, m.term
    `;

    // ✅ FIX: correct parameter order — subjects first, then student filters
    const params = [...paramsMarks, ...paramsStudent];

    const [rows] = await pool.query(sql, params);

    // --- GROUP by student ---
    const out = new Map();

    for (const r of rows) {
      if (!out.has(r.student_id)) {
        const m = String(r.class_name || "").match(/^(\d+)\s*-\s*([A-Za-z])$/);
        const g = m ? Number(m[1]) : null;

        out.set(r.student_id, {
          id: r.student_id,
          name: r.student_name,
          grade: g,
          className: r.class_name,
          marks: [],
        });
      }

      // ✅ FIX: skip null rows (avoid TypeError when m=null)
      if (
        r.subj_id &&
        r.subject_name &&
        r.term_name != null &&
        r.mark_value != null
      ) {
        out.get(r.student_id).marks.push({
          subject_id: r.subj_id,
          subject: r.subject_name,
          term: r.term_name,
          mark: Number(r.mark_value),
        });
      }
    }

    res.json([...out.values()]);
  } catch (err) {
    console.error("getStudentsOverall error:", err.sqlMessage || err);
    res.status(500).json({ error: "Database error" });
  }
};
