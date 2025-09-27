const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");

router.post("/add", noticeController.addNotice);
router.get("/get", noticeController.getAllNotices);
router.delete("/:id", noticeController.deleteNotice);

module.exports = router;
