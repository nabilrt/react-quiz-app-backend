const express = require("express");
const quizRecordController = require("../controller/quizRecordController");
const checkLogin = require("../middleware/checkLogin");

const router = express.Router();

// Route to create a new quiz record
router.post("/add", checkLogin("user"), quizRecordController.createQuizRecord);

// Route to get a specific quiz record by record ID
router.get(
    "/analytics",
    checkLogin("user"),
    quizRecordController.getUserQuizRecord
);
router.get(
    "/admin/analytics",
    checkLogin("admin"),
    quizRecordController.getAdminQuizAnalytics
);

router.get(
    "/leaderboard/:topicCategory",
    checkLogin("user"),
    quizRecordController.getLeaderboard
);

module.exports = router;
