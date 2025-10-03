const express = require("express");
const router = express.Router();
const { getAllTeachersRetirement, getTeacherRetirement } = require("../controllers/retirement.controller");

router.get("/teachers-retirement", getAllTeachersRetirement); // all teachers
router.get("/:teacherId/retirement", getTeacherRetirement); // single teacher

module.exports = router;