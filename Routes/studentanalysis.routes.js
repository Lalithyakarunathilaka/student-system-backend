// routes/students.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentAnalysis.controller");

router.get("/students", ctrl.getStudentsOverall);

module.exports = router;
