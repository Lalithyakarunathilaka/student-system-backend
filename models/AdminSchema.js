// This represents the Admin table structure
const AdminSchema = {
    id: {
      type: "INT",
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: "VARCHAR(100)",
      required: true,
    },
    email: {
      type: "VARCHAR(100)",
      required: true,
      unique: true,
    },
    password: {
      type: "VARCHAR(255)",
      required: true,
    },
  };
  
  module.exports = AdminSchema;
  