const express = require("express");
const { teacherLogin } = require("../controllers/teacherLoginController");

const router = express.Router();

router.post("/login", teacherLogin);

module.exports = router;
