const express = require("express");
const router = express.Router();
const quizController = require("../controller/quizController");
const checkLogin = require("../middleware/checkLogin");
const singleUpload = require("../middleware/file-upload");

// Routes
router.get("/all-quiz", quizController.getAllQuiz);
router.get("/topic/:topic", quizController.getQuizByTopic);
router.post(
    "/add",
    checkLogin("admin"),
    singleUpload,
    quizController.createQuiz
);
router.post(
    "/update/:id",
    checkLogin("admin"),
    singleUpload,
    quizController.updateQuiz
);
router.post(
    "/:quizId/category",
    checkLogin("admin"),
    quizController.addCategoryToQuiz
);
router.post(
    "/:quizId/category/:categoryId/question",
    checkLogin("admin"),
    quizController.addQuestionToCategory
);
router.get("/:quizId", checkLogin("admin"), quizController.getQuizById);

router.delete("/:quizId", checkLogin("admin"), quizController.deleteQuiz);
router.put(
    "/:quizId",
    checkLogin("admin"),
    quizController.updateQuizBasicDetails
);

module.exports = router;
