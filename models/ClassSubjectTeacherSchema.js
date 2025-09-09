// This represents the assignment of teachers to subjects for classes
const ClassSubjectTeacherSchema = {
    id: {
      type: "INT",
      primaryKey: true,
      autoIncrement: true,
    },
    grade: {
      type: "INT",
      required: true,
    },
    class_name: {
      type: "VARCHAR(2)", // e.g., "A", "B", "C"
      required: true,
    },
    subject_id: {
      type: "INT",
      required: true,
      foreignKey: {
        table: "subjects",
        field: "id",
      },
    },
    teacher_id: {
      type: "INT",
      required: true,
      foreignKey: {
        table: "users",
        field: "id",
      },
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
  
  module.exports = ClassSubjectTeacherSchema;
  