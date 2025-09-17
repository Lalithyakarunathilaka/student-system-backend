// Routes/teacherLeaveRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/loginMiddleware");
const teacherLeaveController = require("../controllers/leaveRequestController");

// In-memory file handling (still unused in controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Teacher: submit leave (JWT)
router.post("/submit", auth, upload.single("document"), teacherLeaveController.submitLeave);

// Teacher: get MY leaves (JWT)
router.get("/mine", auth, teacherLeaveController.getMyLeaves);

// Admin: get all (you can wrap with an admin middleware if you have one)
router.get("/get-all", auth, teacherLeaveController.getAllLeaves);

// Admin: get by specific teacher id
router.get("/:teacherId", auth, teacherLeaveController.getLeavesByTeacher);

// Admin: approve/reject
router.put("/:id", auth, teacherLeaveController.updateLeaveStatus);

module.exports = router;
