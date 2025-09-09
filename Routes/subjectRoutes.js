const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");

// Subjects
router.post("/add-subject", subjectController.addSubject);
router.get("/get-subjects", subjectController.getSubjects);

// Assign teacher
router.post("/assign-teacher", subjectController.assignTeacher);
router.get("/get-class-subjects", subjectController.getClassSubjects);

module.exports = router;
