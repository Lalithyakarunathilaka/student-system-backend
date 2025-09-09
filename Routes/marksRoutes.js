const express = require("express");
const router = express.Router();
const marksController = require("../controllers/marksController");

// Get students of the class where teacher is class teacher + subjects
router.get("/class/:teacherId", marksController.getClassStudentsWithSubjects);

// Add or update marks
router.post("/add", marksController.addOrUpdateMarks);

module.exports = router;
