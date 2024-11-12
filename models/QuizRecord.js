const mongoose = require("mongoose");

const quizRecordSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        categoryName: {
            type: String,
            required: true,
        },
        score: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        correctAnswers: { type: Number, required: true },
        incorrectAnswers: { type: Number, required: true },
        attempts: { type: Number, default: 1 }, // Number of attempts on the quiz
        accuracy: { type: Number }, // Calculated accuracy percentage
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const QuizRecord = mongoose.model("QuizRecord", quizRecordSchema);

module.exports = QuizRecord;
