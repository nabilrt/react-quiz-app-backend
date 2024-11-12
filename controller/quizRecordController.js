const QuizRecord = require("../models/QuizRecord");
const Quiz = require("../models/Quiz");
const mongoose = require("mongoose");

// 1. Create a Quiz Record
const createQuizRecord = async (req, res) => {
    try {
        const {
            userId,
            quizId,
            categoryId,
            score,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
        } = req.body;

        // Validate quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Find the category within the quiz
        const category = quiz.categories.id(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Check if the quiz record already exists for this user and quiz
        let quizRecord = await QuizRecord.findOne({
            user: userId,
            quiz: quizId,
            categoryId: category._id,
        });

        if (quizRecord) {
            // Update existing record: increase attempts
            quizRecord.attempts += 1;
            quizRecord.date = new Date(); // Update the date to the latest attempt

            // Compare current metrics with stored best values and update if necessary
            if (score > quizRecord.score) {
                quizRecord.score = score;
            }
            if (correctAnswers > quizRecord.correctAnswers) {
                quizRecord.correctAnswers = correctAnswers;
            }
            if (incorrectAnswers < quizRecord.incorrectAnswers) {
                quizRecord.incorrectAnswers = incorrectAnswers;
            }
            const currentAccuracy = (correctAnswers / totalQuestions) * 100;
            if (currentAccuracy > quizRecord.accuracy) {
                quizRecord.accuracy = currentAccuracy;
            }
            quizRecord.totalQuestions = totalQuestions; // Total questions stays consistent
        } else {
            // Create new quiz record if it doesn't exist
            quizRecord = new QuizRecord({
                user: new mongoose.Types.ObjectId(userId),
                quiz: new mongoose.Types.ObjectId(quizId),
                categoryId: new mongoose.Types.ObjectId(category._id),
                categoryName: category.category,
                score,
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                attempts: 1,
                accuracy: (correctAnswers / totalQuestions) * 100,
                date: new Date(),
            });
        }

        await quizRecord.save();

        res.status(201).json({
            message: quizRecord.isNew
                ? "Quiz record created successfully"
                : "Quiz record updated successfully",
            quizRecord,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// 2. Get a Specific Quiz Record
const getQuizRecord = async (req, res) => {
    try {
        const { recordId } = req.params;

        const quizRecord = await QuizRecord.findById(recordId)
            .populate("quizId")
            .populate("userId");

        if (!quizRecord) {
            return res.status(404).json({ message: "Quiz record not found" });
        }

        res.status(200).json(quizRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// 3. Get All Quiz Records for a User
const getUserQuizRecords = async (req, res) => {
    try {
        const { userId } = req.params;

        const userQuizRecords = await QuizRecord.find({
            userId: mongoose.Types.ObjectId(userId),
        })
            .populate("quizId")
            .sort({ dateAttempted: -1 }); // Sort by most recent

        res.status(200).json(userQuizRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// 4. Get Analytics by Quiz
const getQuizAnalytics = async (req, res) => {
    try {
        const { quizId, categoryId } = req.params;

        // Fetch quiz records for the specified quiz and category
        const quizRecords = await QuizRecord.find({
            quiz: mongoose.Types.ObjectId(quizId),
            categoryId: mongoose.Types.ObjectId(categoryId),
        })
            .populate("userId")
            .sort({ date: -1 });

        if (quizRecords.length === 0) {
            return res
                .status(404)
                .json({ message: "No records found for this quiz category" });
        }

        // Calculate core analytics
        const totalAttempts = quizRecords.length;
        const totalCorrect = quizRecords.reduce(
            (sum, record) => sum + record.correctAnswers,
            0
        );
        const totalIncorrect = quizRecords.reduce(
            (sum, record) => sum + record.incorrectAnswers,
            0
        );
        const avgScore =
            quizRecords.reduce((sum, record) => sum + record.score, 0) /
            totalAttempts;

        // Prepare data for charts
        const scoresOverTime = quizRecords.map((record) => ({
            date: record.date,
            score: record.score,
        }));
        const accuracyOverTime = quizRecords.map((record) => ({
            date: record.date,
            accuracy: (record.correctAnswers / record.totalQuestions) * 100,
        }));

        // Get the top 5 performers based on score
        const topPerformers = quizRecords
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((record) => ({
                userId: record.userId._id,
                userName: record.userId.name,
                score: record.score,
                correctAnswers: record.correctAnswers,
                totalQuestions: record.totalQuestions,
                accuracy: (record.correctAnswers / record.totalQuestions) * 100,
            }));

        // Structure the analytics response
        const analytics = {
            totalAttempts,
            totalCorrect,
            totalIncorrect,
            avgScore,
            scoresOverTime,
            accuracyOverTime,
            topPerformers,
        };

        res.status(200).json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const { userId, categoryId } = req.params;

        // Fetch all quiz records for the specified user and category
        const userQuizRecords = await QuizRecord.find({
            user: mongoose.Types.ObjectId(userId),
            categoryId: mongoose.Types.ObjectId(categoryId),
        }).sort({ date: 1 });

        if (userQuizRecords.length === 0) {
            return res.status(404).json({
                message:
                    "No quiz records found for this user in the specified category",
            });
        }

        // Calculate user-specific analytics and prepare data for charting
        const totalQuizzesTaken = userQuizRecords.length;
        const totalCorrectAnswers = userQuizRecords.reduce(
            (sum, record) => sum + record.correctAnswers,
            0
        );
        const totalIncorrectAnswers = userQuizRecords.reduce(
            (sum, record) => sum + record.incorrectAnswers,
            0
        );
        const totalScore = userQuizRecords.reduce(
            (sum, record) => sum + record.score,
            0
        );

        const avgScore = totalScore / totalQuizzesTaken;
        const accuracy =
            (totalCorrectAnswers /
                (totalCorrectAnswers + totalIncorrectAnswers)) *
            100;

        // Chart-friendly data arrays
        const scoresOverTime = userQuizRecords.map((record) => ({
            date: record.date,
            score: record.score,
        }));

        const correctIncorrectPerQuiz = userQuizRecords.map((record) => ({
            date: record.date,
            correctAnswers: record.correctAnswers,
            incorrectAnswers: record.incorrectAnswers,
        }));

        // Structure the analytics response
        const analytics = {
            summary: {
                totalQuizzesTaken,
                totalCorrectAnswers,
                totalIncorrectAnswers,
                avgScore,
                accuracy: accuracy.toFixed(2) + "%",
            },
            chartData: {
                scoresOverTime,
                correctIncorrectPerQuiz,
            },
        };

        res.status(200).json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getOverallQuizAnalytics = async (req, res) => {
    try {
        // Fetch all quiz records
        const allQuizRecords = await QuizRecord.find()
            .populate("userId")
            .populate("quizId");

        if (allQuizRecords.length === 0) {
            return res.status(404).json({ message: "No quiz records found" });
        }

        // Total attempts and unique quizzes and categories
        const totalAttempts = allQuizRecords.length;
        const uniqueQuizzes = [
            ...new Set(
                allQuizRecords.map((record) => record.quiz._id.toString())
            ),
        ];
        const totalQuizzes = uniqueQuizzes.length;

        // Aggregated stats
        const totalCorrectAnswers = allQuizRecords.reduce(
            (sum, record) => sum + record.correctAnswers,
            0
        );
        const totalIncorrectAnswers = allQuizRecords.reduce(
            (sum, record) => sum + record.incorrectAnswers,
            0
        );
        const overallAvgScore =
            allQuizRecords.reduce((sum, record) => sum + record.score, 0) /
            totalAttempts;
        const overallAccuracy =
            (totalCorrectAnswers /
                (totalCorrectAnswers + totalIncorrectAnswers)) *
            100;

        // Participation by Category
        const categoryParticipation = {};
        allQuizRecords.forEach((record) => {
            const categoryKey = record.categoryId.toString();
            if (!categoryParticipation[categoryKey]) {
                categoryParticipation[categoryKey] = {
                    categoryId: record.categoryId,
                    categoryName: record.categoryName,
                    attempts: 0,
                };
            }
            categoryParticipation[categoryKey].attempts += 1;
        });

        const topCategoriesByParticipation = Object.values(
            categoryParticipation
        )
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 5);

        // Prepare chart-friendly arrays for category participation
        const categoryNames = topCategoriesByParticipation.map(
            (cat) => cat.categoryName
        );
        const categoryAttempts = topCategoriesByParticipation.map(
            (cat) => cat.attempts
        );

        // Chart-friendly data for top users by performance
        const userScores = {};
        allQuizRecords.forEach((record) => {
            const userId = record.userId._id.toString();
            if (!userScores[userId]) {
                userScores[userId] = {
                    userId: record.userId._id,
                    userName: record.userId.name,
                    totalScore: 0,
                    attempts: 0,
                };
            }
            userScores[userId].totalScore += record.score;
            userScores[userId].attempts += 1;
        });

        const topUsersByPerformance = Object.values(userScores)
            .map((user) => ({
                ...user,
                avgScore: user.totalScore / user.attempts,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 5);

        // Prepare chart-friendly arrays for user performance
        const topUserNames = topUsersByPerformance.map((user) => user.userName);
        const topUserAvgScores = topUsersByPerformance.map(
            (user) => user.avgScore
        );

        // Structure the analytics response with chart-friendly data
        const analytics = {
            totalQuizzes,
            totalAttempts,
            overallAvgScore,
            overallAccuracy: overallAccuracy.toFixed(2) + "%",
            topCategoriesByParticipation, // Top 5 categories with the most attempts
            topUsersByPerformance, // Top 5 users by average score across all quizzes
            chartData: {
                categoryNames, // For chart: category names for top 5 most attempted categories
                categoryAttempts, // For chart: attempt counts for top 5 most attempted categories
                topUserNames, // For chart: names of top 5 users by avg score
                topUserAvgScores, // For chart: avg scores of top 5 users by avg score
            },
        };

        res.status(200).json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createQuizRecord,
    getQuizRecord,
    getUserQuizRecords,
    getQuizAnalytics,
    getUserAnalytics,
    getOverallQuizAnalytics,
};
