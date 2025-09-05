const express = require("express");
const router = express.Router();
const { addUser, getUsers } = require("../controllers/addUserController");

// Admin adds a user
router.post("/add", addUser);

// Get all users (optionally filter by role)
router.get("/get", getUsers);

module.exports = router;
