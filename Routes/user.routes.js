const express = require("express");
const router = express.Router();
const { addUser, getUsers, deleteUser, updateUser } = require("../controllers/adduser.controller");

// Admin adds a user
router.post("/add", addUser);


// Get all users 
router.get("/get", getUsers);

// Update user
router.put("/update-user/:id",updateUser);

// Delete user
router.delete("/delete-user/:id",deleteUser);

module.exports = router;
