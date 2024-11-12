const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
    answer: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    answer: { type: [String], required: true }, // Stores the correct answers
});

const categorySchema = new mongoose.Schema({
    category: { type: String, required: true },
    info: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
});

const quizSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    info: { type: String, required: true },
    logo: { type: String, required: true }, // Path to the logo image
    categories: { type: [categorySchema], required: true },
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
