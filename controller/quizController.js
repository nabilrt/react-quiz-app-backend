const Quiz = require("../models/Quiz");
const cloudinaryConfig = require("../config/cloudinary");
const fs = require("fs");

// 1. Create a New Quiz (Basic Details Only)
const createQuiz = async (req, res) => {
    const { topic, info } = req.body;
    const file = req.file;
    try {
        let logo;
        if (file) {
            const image = await cloudinaryConfig.uploader.upload(file.path, {
                folder: "quiz-app",
            });
            logo = image.secure_url;
            fs.unlinkSync(file.path);
        }
        const quiz = new Quiz({ topic, info, logo, categories: [] });
        await quiz.save();
        res.status(201).json({ message: "Quiz created successfully", quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateQuiz = async (req, res) => {
    const { topic, info } = req.body;
    const file = req.file;
    try {
        let logo;
        if (file) {
            const image = await cloudinaryConfig.uploader.upload(file.path, {
                folder: "quiz-app",
            });
            logo = image.secure_url;
            fs.unlinkSync(file.path);
        }
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, {
            topic,
            info,
            ...(logo && { logo }),
        });
        const updatedQuiz = await Quiz.findById(req.params.id);
        res.status(200).json({
            message: "Quiz updated successfully",
            quiz: updatedQuiz,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Add a Category to an Existing Quiz
const addCategoryToQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { category, info } = req.body;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        quiz.categories.push({ category, info, questions: [] });
        await quiz.save();
        const updatedQuiz = await Quiz.findById(quizId);
        res.status(200).json({
            message: "Category added successfully",
            category: updatedQuiz.categories,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCategoryInQuiz = async (req, res) => {
    const { quizId, categoryId } = req.params;
    const { category, info } = req.body;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Find the category by ID within the quiz
        const categoryToUpdate = quiz.categories.id(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Update category and info fields
        categoryToUpdate.category = category;
        categoryToUpdate.info = info;

        // Save the updated quiz
        await quiz.save();
        const updatedQuiz = await Quiz.findById(quizId);
        res.status(200).json({
            message: "Category updated successfully",
            category: updatedQuiz.categories,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateQuestionsInCategory = async (req, res) => {
    const { quizId, categoryId } = req.params;
    const { questions } = req.body;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Find the category by ID within the quiz
        const categoryToUpdate = quiz.categories.id(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Replace the questions array
        categoryToUpdate.questions = questions;

        // Save the updated quiz
        await quiz.save();
        res.status(200).json({
            message: "Questions updated successfully",
            category: categoryToUpdate,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getQuestionsInQuiz = async (req, res) => {
    const { quizId, categoryId } = req.params;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Find the category by ID within the quiz
        const categoryToUpdate = quiz.categories.id(categoryId);
        if (!categoryToUpdate) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json({
            message: "Category Questions Fetched successfully",
            questions: categoryToUpdate.questions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Add a Question to a Specific Category in a Quiz
const addQuestionToCategory = async (req, res) => {
    const { quizId, categoryId } = req.params;
    const { question, options, answer } = req.body;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        const category = quiz.categories.id(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        category.questions.push({ question, options, answer });
        await quiz.save();
        res.status(200).json({ message: "Question added successfully", quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Get Quiz by ID
const getQuizById = async (req, res) => {
    const { quizId } = req.params;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllQuiz = async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Delete a Quiz
const deleteQuiz = async (req, res) => {
    const { quizId } = req.params;
    try {
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    const { quizId, categoryId } = req.params;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        const category = quiz.categories.id(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        quiz.categories.pull({ _id: categoryId });

        // Save the quiz with the category removed
        await quiz.save();

        res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getQuizByTopic = async (req, res) => {
    const { id } = req.params;
    try {
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createQuiz,
    addCategoryToQuiz,
    deleteQuiz,
    getQuizByTopic,
    getAllQuiz,
    updateQuiz,
    updateCategoryInQuiz,
    getQuestionsInQuiz,
    updateQuestionsInCategory,
    deleteCategory,
};
