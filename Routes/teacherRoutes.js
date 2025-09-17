// Routes/teacherRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/loginMiddleware");

const {
  teacherLogin,
  getMe,
  getMyClassesWithStudents,
} = require("../controllers/teacherLoginController");

// NEW: import the getter from marks controller
const { getMyClassData } = require("../controllers/marksController");

// Public
router.post("/login", teacherLogin);

// Protected
router.get("/me", auth, getMe);
router.get("/my-classes", auth, getMyClassesWithStudents);

// 🔥 NEW: teacher’s current class + students + subjects + marks (per term/year)
router.get("/my-class-data", auth, getMyClassData);

module.exports = router;
