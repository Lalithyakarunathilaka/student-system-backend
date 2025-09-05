const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.get("/stats", adminController.getStats);

module.exports = router;
