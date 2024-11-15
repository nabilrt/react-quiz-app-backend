const express = require("express");
const checkLogin = require("../middleware/checkLogin");
const {
    getAllMessages,
    sendMessage,
} = require("../controller/messageController");

const router = express.Router();

router.get("/all", checkLogin("user"), getAllMessages);
router.post("/send", checkLogin("user"), sendMessage);

module.exports = router;
