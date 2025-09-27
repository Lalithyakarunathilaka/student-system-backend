const express = require("express");
const router = express.Router();
const classController = require("../controllers/class.controller");

// Create a new class
router.post("/add-class", classController.createClass);

// Get all classes
router.get("/get-all", classController.getClasses);

module.exports = router;
