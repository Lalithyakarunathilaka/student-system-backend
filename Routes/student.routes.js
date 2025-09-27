const express = require("express");
const { studentLogin } = require("../controllers/studentlogin.controller");

const router = express.Router();

router.post("/login", studentLogin);

module.exports = router;
