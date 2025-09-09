const db = require("../config/db");

// Get students of class teacher + subjects
exports.getClassStudentsWithSubjects = async (req, res) => {
  const { teacherId } = req.params;

  if (!teacherId) return res.status(400).json({ error: "Teacher ID is required." });

  try {
    // Get class assigned to teacher
    const [classRows] = await db.query(
      `SELECT grade, class_name FROM classes WHERE teacher_id = ?`,
      [teacherId]
    );

    if (classRows.length === 0) return res.status(404).json({ error: "No class assigned to this teacher." });

    const { grade, class_name } = classRows[0];

    // Get students in that class
    const [students] = await db.query(
      `SELECT id AS student_id, full_name 
       FROM users 
       WHERE role='student' AND grade=? AND class_name=?`,
      [grade, class_name]
    );

    // Get subjects for this class
    const [subjects] = await db.query(
      `SELECT s.id AS subject_id, s.name AS subject_name
       FROM class_subject_teacher cst
       JOIN subjects s ON s.id = cst.subject_id
       WHERE cst.grade=? AND cst.class_name=?`,
      [grade, class_name]
    );

    res.json({ grade, class_name, students, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Add or update marks
exports.addOrUpdateMarks = async (req, res) => {
  const { student_id, grade, class_name, subject_id, teacher_id, marks } = req.body;

  if (!student_id || !subject_id || !teacher_id || marks === undefined) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Check if marks already exist
    const [existing] = await db.query(
      `SELECT id FROM marks WHERE student_id=? AND subject_id=?`,
      [student_id, subject_id]
    );

    if (existing.length > 0) {
      await db.query(`UPDATE marks SET marks=?, teacher_id=? WHERE id=?`, [
        Number(marks),
        teacher_id,
        existing[0].id,
      ]);
    } else {
      await db.query(
        `INSERT INTO marks (student_id, grade, class_name, subject_id, teacher_id, marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [student_id, grade, class_name, subject_id, teacher_id, Number(marks)]
      );
    }

    res.json({ message: "Marks saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
