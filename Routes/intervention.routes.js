const express = require("express");
const router = express.Router();
const {
  createIntervention,
  listForStudent,
  listNeedingSupportByClass,
  listMine,
} = require("../controllers/intervention.controller");
const { requireAuth } = require("../middleware/auth");

// GET /api/interventions/class/:classId?term=First%20Term&academic_year=2024-2025&threshold=50
router.get("/class/:classId", listNeedingSupportByClass);

// POST /api/interventions
router.post("/", createIntervention);

// GET /api/interventions/student/:studentId
router.get("/student/:studentId", listForStudent);

// Student sees ONLY their interventions (no studentId param)
router.get("/mine", requireAuth(["student"]), listMine);


module.exports = router;
