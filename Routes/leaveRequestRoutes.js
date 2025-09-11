const express = require("express");
const router = express.Router();
const teacherLeaveController = require("../controllers/leaveRequestController");
const multer = require("multer");

// Create a simple multer instance for basic file handling
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Teacher submits a leave request
router.post("/submit", upload.single("document"), teacherLeaveController.submitLeave);

// Admin: Get all leave requests
router.get("/get-all", teacherLeaveController.getAllLeaves);

// Teacher: Get leave requests by teacher ID
router.get("/:teacherId", teacherLeaveController.getLeavesByTeacher);

// Admin: Approve/Reject leave request
router.put("/:id", teacherLeaveController.updateLeaveStatus);

module.exports = router;