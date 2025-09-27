const db = require("../config/db");

exports.getClassData = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const { term, academic_year } = req.query;

    console.log("Fetching class data for:", teacherId, term, academic_year);

    // Fetch class assigned to teacher
    const [classInfo] = await db.query(
      "SELECT id, name FROM classes WHERE teacher_id = ?",
      [teacherId]
    );

    if (!classInfo || classInfo.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    const class_id = classInfo[0].id;
    const class_name = classInfo[0].name;

    //Fetch students in this class
    const [students] = await db.query(
      "SELECT id AS student_id, full_name FROM users WHERE role = 'student' AND class_id = ?",
      [class_id]
    );

    const [subjects] = await db.query(
      "SELECT id AS subject_id, name FROM subjects"
    );    

    res.json({
      students,
      subjects,
      class_name,
      class_id
    });
  } catch (err) {
    console.error("Error fetching class data:", err);
    res.status(500).json({ error: "Database error" });
  }
};


//Bulk add/update marks
exports.bulkAddMarks = async (req, res) => {
  try {
    const { marks, term = "First Term", academic_year = "2024-2025" } = req.body;
    
    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ error: "No marks data provided" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const markData of marks) {
        const { student_id, subject_id, teacher_id, marks: markValue } = markData;
        
        if (markValue === "" || markValue === null) {
          // Skip empty marks 
          await connection.query(
            "DELETE FROM marks WHERE student_id = ? AND subject_id = ? AND term = ? AND academic_year = ?",
            [student_id, subject_id, term, academic_year]
          );
          continue;
        }

        // Validate marks
        const numericMarks = parseInt(markValue);
        if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
          throw new Error(`Invalid marks value: ${markValue} for student ${student_id}`);
        }

        // Check if marks already exist
        const [existing] = await connection.query(
          `SELECT id FROM marks 
           WHERE student_id = ? AND subject_id = ? AND term = ? AND academic_year = ?`,
          [student_id, subject_id, term, academic_year]
        );
        
        if (existing.length > 0) {
          // Update existing marks
          await connection.query(
            `UPDATE marks SET marks = ?, teacher_id = ?, updated_at = NOW() 
             WHERE student_id = ? AND subject_id = ? AND term = ? AND academic_year = ?`,
            [numericMarks, teacher_id, student_id, subject_id, term, academic_year]
          );
        } else {
          // Insert new marks
          await connection.query(
            `INSERT INTO marks (student_id, subject_id, teacher_id, marks, term, academic_year) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [student_id, subject_id, teacher_id, numericMarks, term, academic_year]
          );
        }
      }
      
      await connection.commit();
      res.json({ message: "Marks saved successfully" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error saving marks:", err);
    res.status(500).json({ error: err.message || "Database error" });
  }
};

// Get marks for a specific student (all terms by default)
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, academic_year } = req.query; // <-- no defaults

    const baseSql = `
      SELECT 
        m.*, 
        s.name AS subject_name, 
        t.full_name AS teacher_name
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN users t ON m.teacher_id = t.id
    `;

    const where = ['m.student_id = ?'];
    const params = [studentId];

    if (term && term.trim()) {
      where.push('m.term = ?');
      params.push(term.trim());
    }

    if (academic_year && academic_year.trim()) {
      where.push('m.academic_year = ?');
      params.push(academic_year.trim());
    }

    // Order by academic year then term (First→Second→Third), then subject
    const sql = `
      ${baseSql}
      WHERE ${where.join(' AND ')}
      ORDER BY 
        m.academic_year,
        FIELD(m.term, 'First Term','Second Term','Third Term'),
        s.name
    `;

    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching student marks:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};


// Get marks for a specific class
exports.getClassMarks = async (req, res) => {
  try {
    const { classId } = req.params;
    const { term, academic_year } = req.query;

    const [marks] = await db.query(
      `SELECT m.*, u.full_name as student_name, s.name as subject_name, t.full_name as teacher_name
       FROM marks m
       JOIN users u ON m.student_id = u.id
       JOIN subjects s ON m.subject_id = s.id
       JOIN users t ON m.teacher_id = t.id
       WHERE u.class_id = ? AND m.term = ? AND m.academic_year = ?
       ORDER BY u.full_name, s.name`,
      [classId, term, academic_year]
    );

    res.json(marks);
  } catch (err) {
    console.error("Error fetching class marks:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET /api/teacher/my-class-data?term=First%20Term&academic_year=2024-2025
exports.getMyClassData = async (req, res) => {
  try {
    const { id: teacherId, role } = req.user;
    if (role !== "teacher") return res.status(403).json({ error: "Forbidden" });

    const { term = "First Term", academic_year = "2024-2025" } = req.query;

    // class for this teacher
    const [classInfo] = await db.query(
      "SELECT id, name FROM classes WHERE teacher_id = ? LIMIT 1",
      [teacherId]
    );
    if (!classInfo || classInfo.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }
    const { id: class_id, name: class_name } = classInfo[0];

    // students in the class
    const [students] = await db.query(
      "SELECT id AS student_id, full_name AS student_name FROM users WHERE role='student' AND class_id = ? AND deleted_at IS NULL ORDER BY full_name",
      [class_id]
    );

    // subjects 
    const [subjects] = await db.query(
      "SELECT id AS subject_id, name AS subject_name FROM subjects ORDER BY name"
    );

    // marks for this class+term+year
    const [marks] = await db.query(
      `SELECT m.student_id, m.subject_id, m.marks, m.term, m.academic_year,
              t.full_name AS teacher_name
         FROM marks m
         JOIN users u ON u.id = m.student_id
         JOIN users t ON t.id = m.teacher_id
        WHERE u.class_id = ?
          AND m.term = ?
          AND m.academic_year = ?
        ORDER BY u.full_name`,
      [class_id, term, academic_year]
    );

    res.json({
      class_id,
      class_name,
      term,
      academic_year,
      students,   
      subjects,   
      marks       
    });
  } catch (err) {
    console.error("getMyClassData error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Identify weak students
exports.getSupportNeededStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { term, academic_year } = req.query;

    const [rows] = await db.query(
      `SELECT u.id AS student_id, u.full_name AS student_name, 
              AVG(m.marks) AS avg_marks
         FROM users u
    LEFT JOIN marks m 
           ON u.id = m.student_id 
          AND m.term = ? 
          AND m.academic_year = ?
        WHERE u.class_id = ? 
          AND u.role = 'student'
     GROUP BY u.id, u.full_name
     ORDER BY avg_marks ASC`,
      [term, academic_year, classId]
    );

    // check avg < 40
    const threshold = 50;
    const supportNeeded = rows.filter(r => r.avg_marks !== null && r.avg_marks < threshold);

    res.json({ students: rows, supportNeeded });
  } catch (err) {
    console.error("Error in getSupportNeededStudents:", err);
    res.status(500).json({ error: "Database error" });
  }
};
