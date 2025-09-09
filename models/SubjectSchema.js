// This represents the Subjects table structure
const SubjectSchema = {
    id: {
      type: "INT",
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: "VARCHAR(100)",
      required: true,
    },
    grade: {
      type: "INT",
      required: true,
    },
    created_at: {
      type: "DATETIME",
      default: "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "DATETIME",
      default: "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    },
  };
  
  module.exports = SubjectSchema;
  