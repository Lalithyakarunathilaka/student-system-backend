// controllers/leaveRequestController.js
const db = require("../config/db");

// ✅ Teacher submits a leave request (uses JWT)
exports.submitLeave = async (req, res) => {
  try {
    const { id: teacherId, role } = req.user || {};
    if (!teacherId || role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      // no teacher_id from body!
      name,              // optional — we can derive from DB if omitted
      class_assigned,    // optional — we can derive from DB if omitted
      leave_type,
      start_date,
      end_date,
      reason
    } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: "leave_type, start_date and end_date are required" });
    }

    // derive teacher basic info if fields are missing
    let derivedName = name;
    let derivedClass = class_assigned;

    if (!derivedName || !derivedClass) {
      // find teacher + class name (first class if multiple)
      const [[t]] = await db.query(
        `SELECT u.full_name, c.name AS class_name
           FROM users u
      LEFT JOIN classes c ON c.teacher_id = u.id
          WHERE u.id = ? AND u.role='teacher' AND u.deleted_at IS NULL
          LIMIT 1`,
        [teacherId]
      );
      if (!derivedName) derivedName = t?.full_name || null;
      if (!derivedClass) derivedClass = t?.class_name || null;
    }

    // For now, still not storing files
    const document = null;

    const [results] = await db.query(
      `INSERT INTO teacher_leaves
       (teacher_id, name, class_assigned, leave_type, start_date, end_date, reason, document)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacherId, derivedName, derivedClass, leave_type, start_date, end_date, reason || "", document]
    );

    res.status(201).json({ message: "Leave request submitted successfully", id: results.insertId });
  } catch (err) {
    console.error("❌ Error submitting leave request:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Admin view — all leaves (optionally guard with an admin check)
exports.getAllLeaves = async (_req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM teacher_leaves ORDER BY created_at DESC"
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching leave requests:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Teacher view — MY leaves (uses JWT)
exports.getMyLeaves = async (req, res) => {
  try {
    const { id: teacherId, role } = req.user || {};
    if (!teacherId || role !== "teacher") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [results] = await db.query(
      "SELECT * FROM teacher_leaves WHERE teacher_id = ? ORDER BY created_at DESC",
      [teacherId]
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching my leaves:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ (Optional) Admin: leaves by teacher id
exports.getLeavesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const [results] = await db.query(
      "SELECT * FROM teacher_leaves WHERE teacher_id = ? ORDER BY created_at DESC",
      [teacherId]
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching teacher leaves:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Admin: Approve/Reject
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment, admin_comment } = req.body;
    const comment = adminComment || admin_comment || "";

    const [results] = await db.query(
      `UPDATE teacher_leaves
          SET status = ?, admin_comment = ?, updated_at = NOW()
        WHERE id = ?`,
      [status, comment, id]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }
    res.json({ message: "Leave status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating leave status:", err);
    res.status(500).json({ error: "Database error" });
  }
};
