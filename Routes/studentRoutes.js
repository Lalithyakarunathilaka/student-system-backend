const express = require("express");
const { studentLogin } = require("../controllers/studentLoginController");

const router = express.Router();

router.post("/login", studentLogin);

module.exports = router;
