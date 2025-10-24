const pool = require("../config/db");

// 🧹 Utility
function cleanName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
}

// ✅ Add subject
exports.addSubject = async (req, res) => {
  let { name, grade } = req.body;
  if (!name || !grade) {
    return res.status(400).json({ error: "Subject name and grade are required" });
  }
  name = cleanName(name);

  try {
    const [result] = await pool.query(
      "INSERT INTO subjects (name, grade, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [name, grade]
    );
    res.status(201).json({ message: "Subject added successfully", id: result.insertId });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Subject already exists for this grade" });
    }
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Update subject
exports.updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name, grade } = req.body;

  if (!name || !grade) {
    return res.status(400).json({ error: "Subject name and grade are required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM subjects WHERE name = ? AND grade = ? AND id != ?",
      [name, grade, id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Subject already exists for this grade" });
    }

    const [result] = await pool.query(
      "UPDATE subjects SET name = ?, grade = ?, updated_at = NOW() WHERE id = ?",
      [name, grade, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json({ message: "Subject updated successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Delete subject
exports.deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM subjects WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Get all subjects
exports.getSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, grade FROM subjects ORDER BY grade, name"
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Assign teacher to subject
exports.assignTeacher = async (req, res) => {
  const { grade, class_name, subject_id, teacher_id } = req.body;

  if (!grade || !class_name || !subject_id || !teacher_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM class_subject_teacher WHERE grade = ? AND class_name = ? AND subject_id = ?",
      [grade, class_name, subject_id]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE class_subject_teacher SET teacher_id = ?, updated_at = NOW() WHERE id = ?",
        [teacher_id, existing[0].id]
      );
      return res.json({ message: "Teacher assignment updated successfully" });
    }

    await pool.query(
      "INSERT INTO class_subject_teacher (grade, class_name, subject_id, teacher_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [grade, class_name, subject_id, teacher_id]
    );

    res.status(201).json({ message: "Teacher assigned successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// controllers/subjects.controller.js
exports.getSubjectsByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const [rows] = await pool.query(
      "SELECT id, name, grade FROM subjects WHERE grade = ? ORDER BY name",
      [Number(grade)]
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};


// ✅ Get subjects + assigned teachers per class
exports.getClassSubjects = async (req, res) => {
  const { grade, class_name } = req.query;
  if (!grade || !class_name) {
    return res.status(400).json({ error: "Grade and class_name are required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT cst.id, s.name AS subject_name, u.full_name AS teacher_name
       FROM class_subject_teacher cst
       JOIN subjects s ON cst.subject_id = s.id
       JOIN users u ON cst.teacher_id = u.id
       WHERE cst.grade = ? AND cst.class_name = ?`,
      [grade, class_name]
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
