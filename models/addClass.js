const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // e.g., "1-A", "6-B"
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // references a teacher
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);
