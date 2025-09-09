const pool = require("../config/db");

// Add User (Student or Teacher)
exports.addUser = async (req, res) => {
  const {
    full_name,
    email,
    password,
    role,
    grade,
    gender,
    date_of_birth,
    join_date, // frontend sends join_date
  } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // For teachers
  if (role === "teacher" && (!date_of_birth || !join_date)) {
    return res.status(400).json({ error: "Teachers must have Date of Birth and Join Date" });
  }
  

  try {
    // Check for existing email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await pool.query(
      `INSERT INTO users 
      (full_name, email, password, role, grade, gender, date_of_birth, hire_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        full_name,
        email,
        password,
        role,
        grade || null,
        gender || null,
        date_of_birth || null,
        join_date || null, // store in hire_date
      ]
    );

    res.status(201).json({ message: `${role} added successfully` });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Get all users (optionally filter by role)
exports.getUsers = async (req, res) => {
  const { role } = req.query;

  try {
    const sql = `
      SELECT 
        id, 
        full_name, 
        email, 
        grade,
        gender,
        DATE(date_of_birth) AS date_of_birth, 
        DATE(hire_date) AS join_date, 
        role
      FROM users 
      WHERE deleted_at IS NULL
      ${role ? "AND role = ?" : ""}
    `;
    const params = role ? [role] : [];

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    email,
    password,
    role,
    grade,
    gender,
    date_of_birth,
    join_date, // frontend sends join_date
  } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: "Full name and email are required" });
  }

  try {
    let sql = `
      UPDATE users
      SET full_name = ?, email = ?, role = ?, grade = ?, gender = ?, date_of_birth = ?, hire_date = ?, updated_at = NOW()
    `;
    const params = [full_name, email, role, grade || null, gender || null, date_of_birth || null, join_date || null];

    if (password && password.trim() !== "") {
      sql += ", password = ?";
      params.push(password);
    }

    sql += " WHERE id = ?";
    params.push(id);

    await pool.query(sql, params);
    res.json({ message: `${role} updated successfully` });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Soft Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found or already deleted" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
