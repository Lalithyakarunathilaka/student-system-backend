const express = require("express");
const router = express.Router();
const marksController = require("../controllers/marksController");
// const { authenticateToken } = require("../middleware/loginMiddleware");

// // Apply authentication to all routes
// router.use(authenticateToken);

// Get class data for teacher
router.get("/class/:teacherId", marksController.getClassData);

// Bulk add/update marks
router.post("/bulk-add", marksController.bulkAddMarks);

// Get marks for specific student
router.get("/student/:studentId", marksController.getStudentMarks);

// Get marks for specific class
router.get("/class-marks/:classId", marksController.getClassMarks);

module.exports = router;