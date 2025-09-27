const pool = require("../config/db");

// Add Notice
exports.addNotice = async (req, res) => {
  const { title, description, category, permission } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const sql = `INSERT INTO notices (title, description, category, permission) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [title, description, category, permission || "Both"]);

    res.status(201).json({
      message: "Notice added successfully",
      notice: { id: result.insertId, title, description, category, permission }
    });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// Get Notices
exports.getAllNotices = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM notices ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
};

// Delete Notice
exports.deleteNotice = async (req, res) => {
  try {
    await pool.query("DELETE FROM notices WHERE id = ?", [req.params.id]);
    res.json({ message: "Notice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
};
