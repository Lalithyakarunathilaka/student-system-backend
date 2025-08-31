const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, "studentdata.json");
const noticesFilePath = path.join(__dirname, "notices.json");

if (!fs.existsSync(noticesFilePath)) {
    fs.writeFileSync(noticesFilePath, JSON.stringify([]));
}

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "lalithya",
  database: "school_management_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// get student data 
app.get("/api/students", (req, res) => {
    fs.readFile(dataFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading student data:", err);
            return res.status(500).json({ error: "Failed to read data" });
        }

        let students = JSON.parse(data);

        // subject filter
        const subjectFilter = req.query.subject;
        if (subjectFilter) {
            students = students.map(student => ({
                ...student,
                marks: student.marks.filter(mark => mark.subject === subjectFilter)
            })).filter(student => student.marks.length > 0);
        }

        // term filter
        const termFilter = req.query.term;
        if (termFilter) {
            students = students.map(student => ({
                ...student,
                marks: student.marks.filter(mark => mark.term === termFilter)
            })).filter(student => student.marks.length > 0);
        }

        res.json(students);
    });
});

// // get all notices
// app.get("/api/notices", (req, res) => {
//     fs.readFile(noticesFilePath, "utf8", (err, data) => {
//         if (err) {
//             console.error("Error reading notices data:", err);
//             return res.status(500).json({ error: "Failed to read data" });
//         }

//         const notices = JSON.parse(data);
//         res.json(notices);
//     });
// });

// // add a new notice
// app.post("/api/addNotice", (req, res) => {
//     const { title, description, category } = req.body;

//     if (!title || !description || !category) {
//         return res.status(400).json({ error: "Title, description, and category are required" });
//     }

//     const newNotice = { id: Date.now(), title, description, category, date: new Date().toISOString() };

//     fs.readFile(noticesFilePath, "utf8", (err, data) => {
//         if (err) {
//             console.error("Error reading notices data:", err);
//             return res.status(500).json({ error: "Failed to read data" });
//         }

//         let notices = JSON.parse(data);
//         notices.push(newNotice);

//         fs.writeFile(noticesFilePath, JSON.stringify(notices, null, 2), (err) => {
//             if (err) {
//                 console.error("Error saving notice data:", err);
//                 return res.status(500).json({ error: "Failed to save data" });
//             }
//             res.status(201).json({ message: "Notice added successfully", notice: newNotice });
//         });
//     });
// });

// // API to delete a notice
// app.delete("/api/deleteNotice/:id", (req, res) => {
//     const noticeId = parseInt(req.params.id);

//     fs.readFile(noticesFilePath, "utf8", (err, data) => {
//         if (err) {
//             console.error("Error reading notices data:", err);
//             return res.status(500).json({ error: "Failed to read data" });
//         }

//         let notices = JSON.parse(data);
//         const filteredNotices = notices.filter(notice => notice.id !== noticeId);

//         if (notices.length === filteredNotices.length) {
//             return res.status(404).json({ message: "Notice not found" });
//         }

//         fs.writeFile(noticesFilePath, JSON.stringify(filteredNotices, null, 2), (err) => {
//             if (err) {
//                 console.error("Error saving notices data:", err);
//                 return res.status(500).json({ error: "Failed to save data" });
//             }
//             res.json({ message: "Notice deleted successfully" });
//         });
//     });
// });

app.post("/api/add-notices", (req, res) => {
  const { title, description, category, permission } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Title, description, and category are required" });
  }

  const sql = `INSERT INTO notices (title, description, category, permission) VALUES (?, ?, ?, ?)`;

  pool.query(sql, [title, description, category, permission || "Both"])
    .then(([result]) => {
      const newNotice = {
        id: result.insertId,
        title,
        description,
        category,
        permission: permission || "Both",
      };
      res.status(201).json({ message: "Notice added successfully", notice: newNotice });
    })
    .catch((err) => {
      console.error("DB insert error:", err);
      res.status(500).json({ message: "Database error" });
    });
});


// Get all notices
app.get("/api/notices", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM notices ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// Get single notice
app.get("/api/notices/:id", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM notices WHERE id = ?", [req.params.id]);
    if (results.length === 0) return res.status(404).json({ message: "Notice not found" });
    res.json(results[0]);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// Delete notice
app.delete("/api/notices/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM notices WHERE id = ?", [req.params.id]);
    res.json({ message: "Notice deleted successfully" });
  } catch (err) {
    console.error("DB delete error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// Update notice
app.put("/api/notices/:id", async (req, res) => {
  const { title, description, category, permission } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "Title, description, and category are required" });
  }

  try {
    const sql = `UPDATE notices SET title=?, description=?, category=?, permission=? WHERE id=?`;
    await pool.query(sql, [title, description, category, permission || "both", req.params.id]);
    res.json({ message: "Notice updated successfully" });
  } catch (err) {
    console.error("DB update error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

  
app.post("/api/admin-register", async (req, res) => {
    const { name, email, password } = req.body;
  
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
  
    try {
      // Check if email already exists
      const [rows] = await pool.query("SELECT id FROM admin WHERE email = ?", [email]);
      if (rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }
  
      // Insert new admin
      await pool.query(
        "INSERT INTO admin(name, email, password) VALUES (?, ?, ?)",
        [name, email, password]  // Reminder: hash password before saving in production
      );
  
      res.status(201).json({ message: "Admin registered successfully" });
    } catch (error) {
      console.error("MySQL error during registration:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
  
  app.post("/api/admin-login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
  
    try {
      const [rows] = await pool.query(
        "SELECT * FROM admin WHERE email = ? AND password = ?",
        [email, password]  // Reminder: use hashed password comparison in real apps
      );
  
      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      // Generate JWT token or simple token here
      const token = "fake-jwt-token";
  
      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("MySQL error during login:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Register user (admin adds user)
  app.post("/api/admin/add-user", async (req, res) => {
    const { fullName, email, password, role, grade, gender } = req.body;
  
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    try {
      // Check if email already exists
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }
  
      // Insert user
      await pool.query(
        "INSERT INTO users (full_name, email, password, role, grade, gender) VALUES (?, ?, ?, ?, ?, ?)",
        [fullName, email, password, role, grade || null, gender || null]
      );
  
      res.status(201).json({ message: "User added successfully" });
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get all users with role
app.get("/api/users", async (req, res) => {
  const { role } = req.query; 
  try {
    let sql = "SELECT id, full_name, email, role FROM users";
    const params = [];

    if (role) {
      sql += " WHERE role = ?";
      params.push(role);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database error" });
  }
});

  
//student login  
  app.post("/api/student-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Query user by email
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    // Check if user role is student
    if (user.role !== "student") {
      return res.status(403).json({ error: "You must use a student email to login here" });
    }

    // Check password (assuming plaintext for now; hash in production)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // All good - send success response and token
    const token = "fake-jwt-token";
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("MySQL error during login:", error);
    res.status(500).json({ error: "Database error" });
  }
});
//teacher login
app.post("/api/teacher-login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
  
    try {
      // Query user by email
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
  
      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      const user = rows[0];
  
      // Check if user role is teacher
      if (user.role !== "teacher") {
        return res.status(403).json({ error: "You must use a teacher email to login here" });
      }
  
      // Check password (plaintext for now; hash in production)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
  
      // Login success — return token or session info
      const token = "fake-jwt-token";
      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("MySQL error during teacher login:", error);
      res.status(500).json({ error: "Database error" });
    }
  });
  
  // Dashboard stats API
app.get("/api/admin/stats", async (req, res) => {
  try {
    // Count users
    const [userResult] = await pool.query("SELECT COUNT(*) AS count FROM users");

    // Count classes (if your table exists)
    // let classCount = 0;
    // try {
    //   const [classResult] = await pool.query("SELECT COUNT(*) AS count FROM classes");
    //   classCount = classResult[0].count;
    // } catch (err) {
    //   console.warn("⚠️ Classes table not found, skipping...");
    // }

    res.json({
      users: userResult[0].count,
      classes: classCount,
    });
  } catch (err) {
    console.error("DB error in /api/admin/stats:", err);
    res.status(500).json({ error: "Database error" });
  }
});

  
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// const express = require("express");
// const cors = require("cors");

// const app = express();
// const PORT = 5001;

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/admin", require("./Routes/adminRoutes"));
// app.use("/api/users", require("./routes/userRoutes"));   // to be created
// app.use("/api/notices", require("./routes/noticeRoutes"));
// app.use("/api/classes", require("./routes/classRoutes"));
// app.use("/api/students", require("./routes/studentRoutes"));
// app.use("/api/teachers", require("./routes/teacherRoutes"));

// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

