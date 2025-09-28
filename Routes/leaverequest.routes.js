// Routes/teacherLeaveRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/loginMiddleware");
const teacherLeaveController = require("../controllers/leaverequest.controller");


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// submit leave
router.post("/submit", auth, upload.single("document"), teacherLeaveController.submitLeave);

// get MY leaves 
router.get("/mine", auth, teacherLeaveController.getMyLeaves);

// Admin get all 
router.get("/get-all", auth, teacherLeaveController.getAllLeaves);

// Admin get by specific teacher id
router.get("/:teacherId", auth, teacherLeaveController.getLeavesByTeacher);

// Admin approve/reject
router.put("/:id", auth, teacherLeaveController.updateLeaveStatus);

module.exports = router;
