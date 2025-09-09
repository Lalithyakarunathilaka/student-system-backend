
const ClassSchema = {
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
};

module.exports = ClassSchema;
