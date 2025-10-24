const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subject.controller"); // ✅ FIXED name

// Subjects CRUD
router.post("/add-subject", subjectController.addSubject);
router.put("/update-subject/:id", subjectController.updateSubject);
router.delete("/delete-subject/:id", subjectController.deleteSubject);
router.get("/get-subjects", subjectController.getSubjects);
router.get("/by-grade/:grade", subjectController.getSubjectsByGrade);
// Assign teachers
router.post("/assign-teacher", subjectController.assignTeacher);
router.get("/get-class-subjects", subjectController.getClassSubjects);

module.exports = router;
