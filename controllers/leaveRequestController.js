const db = require("../config/db");

// ✅ Teacher submits a leave request
exports.submitLeave = async (req, res) => {
  try {
    const { teacher_id, name, class_assigned, leave_type, start_date, end_date, reason } = req.body;
    
    // For now, set document to null since we're not handling file uploads
    const document = null;

    const query = `
      INSERT INTO teacher_leaves 
      (teacher_id, name, class_assigned, leave_type, start_date, end_date, reason, document) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [results] = await db.query(
      query,
      [teacher_id, name, class_assigned, leave_type, start_date, end_date, reason, document]
    );
    
    res.status(201).json({ message: "Leave request submitted successfully", id: results.insertId });
  } catch (err) {
    console.error("❌ Error submitting leave request:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Get all leave requests (Admin view)
exports.getAllLeaves = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM teacher_leaves ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching leave requests:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ✅ Get leave requests by teacher ID (Teacher view)
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

// ✅ Admin: Approve/Reject leave request
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment, admin_comment } = req.body;

    // Use either adminComment or admin_comment
    const comment = adminComment || admin_comment || "";

    console.log("Received update request:", { id, status, comment });

    const query = `
      UPDATE teacher_leaves 
      SET status = ?, admin_comment = ?, updated_at = NOW() 
      WHERE id = ?
    `;

    const [results] = await db.query(query, [status, comment, id]);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }
    
    res.json({ message: "Leave status updated successfully" });
  } catch (err) {
    console.error("❌ Error updating leave status:", err);
    res.status(500).json({ error: "Database error" });
  }
};