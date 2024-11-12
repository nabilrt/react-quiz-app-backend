const Quiz = require("../models/Quiz");

// 1. Create a New Quiz (Basic Details Only)
const createQuiz = async (req, res) => {
    const { topic, info, logo } = req.body;
    try {
        const quiz = new Quiz({ topic, info, logo, categories: [] });
        await quiz.save();
        res.status(201).json({ message: "Quiz created successfully", quiz });
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
        res.status(200).json({ message: "Category added successfully", quiz });
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

// 5. Get All Quizzes
const getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.status(200).json(quizzes);
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

// 7. Update Quiz Basic Details
const updateQuizBasicDetails = async (req, res) => {
    const { quizId } = req.params;
    const { topic, info, logo } = req.body;
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }
        quiz.topic = topic || quiz.topic;
        quiz.info = info || quiz.info;
        quiz.logo = logo || quiz.logo;
        await quiz.save();
        res.status(200).json({ message: "Quiz updated successfully", quiz });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getQuizByTopic = async (req, res) => {
    const { topic } = req.params;
    try {
        const quiz = await Quiz.findOne({ topic: topic });
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
    addQuestionToCategory,
    getQuizById,
    getAllQuizzes,
    deleteQuiz,
    updateQuizBasicDetails,
    getQuizByTopic,
    getAllQuiz,
};