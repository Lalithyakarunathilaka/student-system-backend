// Routes/teacherRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/loginMiddleware");

const {
  teacherLogin,
  getMe,
  getMyClassesWithStudents,
} = require("../controllers/teacherlogin.controller");


const { getMyClassData } = require("../controllers/marks.controller");


router.post("/login", teacherLogin);


router.get("/me", auth, getMe);
router.get("/my-classes", auth, getMyClassesWithStudents);


router.get("/my-class-data", auth, getMyClassData);

module.exports = router;
