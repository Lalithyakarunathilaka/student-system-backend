// This represents the Messages table structure
const MessageSchema = {
    id: {
      type: "INT",
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: "INT",
      required: true,
      foreignKey: "users(id)",
    },
    receiver_id: {
      type: "INT",
      required: true,
      foreignKey: "users(id)",
    },
    class_id: {
      type: "INT",
      required: true,
      foreignKey: "classes(id)",
    },
    content: {
      type: "TEXT",
      required: true,
    },
    created_at: {
      type: "DATETIME",
      default: "CURRENT_TIMESTAMP",
    },
  };
  
  module.exports = MessageSchema;
  