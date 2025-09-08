const pool = require("../config/db");

// Create new class
exports.createClass = async (req, res) => {
  const { name, teacherId } = req.body;

  if (!name || !teacherId) {
    return res.status(400).json({ error: "Class name and teacher are required" });
  }

  try {
    // Check if class already exists
    const [existing] = await pool.query("SELECT id FROM classes WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Class name already exists" });
    }

    // Insert class
    await pool.query("INSERT INTO classes (name, teacher_id) VALUES (?, ?)", [
      name,
      teacherId,
    ]);

    res.status(201).json({ message: "Class created successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get all classes
exports.getClasses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, u.full_name AS teacher 
       FROM classes c 
       JOIN users u ON c.teacher_id = u.id`
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
