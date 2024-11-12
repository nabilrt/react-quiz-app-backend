const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
    {
        score: { type: Number, required: true },
        correctAnswers: { type: Number, required: true },
        incorrectAnswers: { type: Number, required: true },
        accuracy: { type: Number, required: true }, // Calculated accuracy percentage
        date: { type: Date, default: Date.now },
    },
    { _id: false } // Disable _id for each attempt to reduce clutter
);

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
        totalQuestions: { type: Number, required: true },
        attempts: { type: [attemptSchema], default: [] }, // Track individual attempts
    },
    { timestamps: true }
);

const QuizRecord = mongoose.model("QuizRecord", quizRecordSchema);

module.exports = QuizRecord;
