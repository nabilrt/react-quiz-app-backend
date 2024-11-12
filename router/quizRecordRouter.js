const express = require("express");
const quizRecordController = require("../controller/quizRecordController");
const checkLogin = require("../middleware/checkLogin");

const router = express.Router();

// Route to create a new quiz record
router.post("/add", checkLogin("user"), quizRecordController.createQuizRecord);

// Route to get a specific quiz record by record ID
router.get("/analytics", checkLogin("user"),quizRecordController.getUserQuizRecord);
router.get("/admin/analytics", checkLogin("admin"),quizRecordController.getAdminQuizAnalytics);

// Route to get all quiz records for a specific user
router.get("/user/:userId", quizRecordController.getUserQuizRecords);

// Route to get analytics for a specific quiz
router.get(
    "/quiz/:quizId/:categoryId/analytics",
    checkLogin("admin"),
    quizRecordController.getQuizAnalytics
);

router.get("/user/:userId/:categoryId/analytics", quizRecordController.getUserAnalytics);

router.get(
    "/overall/analytics",
    checkLogin("admin"),
    quizRecordController.getOverallQuizAnalytics
);

module.exports = router;
