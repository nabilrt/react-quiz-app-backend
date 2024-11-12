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

        // Calculate accuracy for the current attempt
        const accuracy = (correctAnswers / totalQuestions) * 100;

        // Check if the quiz record already exists for this user and quiz
        let quizRecord = await QuizRecord.findOne({
            user: userId,
            quiz: quizId,
            categoryId: category._id,
        });

        if (quizRecord) {
            // Update existing record: add new attempt to the attempts array
            quizRecord.attempts.push({
                score,
                correctAnswers,
                incorrectAnswers,
                accuracy,
                date: new Date(),
            });

            // Update total questions if it has changed
            if (quizRecord.totalQuestions !== totalQuestions) {
                quizRecord.totalQuestions = totalQuestions;
            }
        } else {
            // Create new quiz record with the first attempt
            quizRecord = new QuizRecord({
                user: new mongoose.Types.ObjectId(userId),
                quiz: new mongoose.Types.ObjectId(quizId),
                categoryId: new mongoose.Types.ObjectId(category._id),
                categoryName: category.category,
                totalQuestions,
                attempts: [
                    {
                        score,
                        correctAnswers,
                        incorrectAnswers,
                        accuracy,
                        date: new Date(),
                    },
                ],
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
const getUserQuizRecord = async (req, res) => {
    try {
        const quizRecords = await QuizRecord.find({ user: req.user.userId })
            .populate("user")
            .populate("quiz"); // Populate the quiz to access the topic

        if (!quizRecords || quizRecords.length === 0) {
            return res.status(404).json({ message: "No quiz records found" });
        }

        // Initialize accumulators
        let totalAttempts = 0;
        let totalScore = 0;
        let totalCorrectAnswers = 0;
        let totalQuestions = 0;
        const topicScoreDistribution = {}; // For topic-based average score distribution
        const accuracyOverTime = [];
        const categoryAttempts = {};
        const correctAnswersByCategory = {}; // For top categories by correct answers
        const topicAttempts = {};
        const correctIncorrectPerCategory = {};

        // Process each quiz record and its attempts
        quizRecords.forEach((record) => {
            // Aggregate data from each attempt
            record.attempts.forEach((attempt) => {
                totalAttempts += 1;
                totalScore += attempt.score;
                totalCorrectAnswers += attempt.correctAnswers;
                totalQuestions += record.totalQuestions;

                // Group scores by topic
                const topic = record.quiz.topic;
                if (!topicScoreDistribution[topic]) {
                    topicScoreDistribution[topic] = {
                        totalScore: 0,
                        count: 0, // Track the number of attempts for averaging
                    };
                }
                topicScoreDistribution[topic].totalScore += attempt.score;
                topicScoreDistribution[topic].count += 1;

                // Accuracy over time for each attempt
                accuracyOverTime.push({
                    date: attempt.date,
                    accuracy: attempt.accuracy,
                    topic: record.quiz.topic,
                    category: record.categoryName,
                });

                // Track attempts per category
                const categoryKey = `${record.quiz.topic} - ${record.categoryName}`;
                categoryAttempts[categoryKey] =
                    (categoryAttempts[categoryKey] || 0) + 1;

                // Track correct answers per category for top 5 categories by correct answers
                if (!correctAnswersByCategory[categoryKey]) {
                    correctAnswersByCategory[categoryKey] = {
                        topic: record.quiz.topic,
                        category: record.categoryName,
                        correct: 0,
                    };
                }
                correctAnswersByCategory[categoryKey].correct +=
                    attempt.correctAnswers;

                // Track correct vs. incorrect answers per category
                if (!correctIncorrectPerCategory[categoryKey]) {
                    correctIncorrectPerCategory[categoryKey] = {
                        topic: record.quiz.topic,
                        category: record.categoryName,
                        correct: 0,
                        incorrect: 0,
                    };
                }
                correctIncorrectPerCategory[categoryKey].correct +=
                    attempt.correctAnswers;
                correctIncorrectPerCategory[categoryKey].incorrect +=
                    attempt.incorrectAnswers;

                // Track attempts per topic
                topicAttempts[record.quiz.topic] =
                    (topicAttempts[record.quiz.topic] || 0) + 1;
            });
        });

        // Calculate single values
        const totalQuizzes = quizRecords.length;
        const averageScore = (totalScore / totalAttempts).toFixed(2);
        const overallAccuracy = (
            (totalCorrectAnswers / totalQuestions) *
            100
        ).toFixed(2);
        const mostAttemptedCategory = Object.keys(categoryAttempts).reduce(
            (a, b) => (categoryAttempts[a] > categoryAttempts[b] ? a : b)
        );

        // Convert topic score distribution to an array with average scores
        let scoreDistribution = Object.entries(topicScoreDistribution).map(
            ([topic, data]) => ({
                topic,
                averageScore: (data.totalScore / data.count).toFixed(2), // Calculate average score
            })
        );

        // Sort by average score in descending order and take the top 5
        scoreDistribution = scoreDistribution
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5);

        // Sort and select top 5 most attempted categories
        const topMostAttemptedCategories = Object.entries(categoryAttempts)
            .map(([key, attempts]) => {
                const [topic, category] = key.split(" - ");
                return { topic, category, attempts };
            })
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 5);

        // Sort and select top 5 categories by correct answers
        const topCategoriesByCorrectAnswers = Object.values(
            correctAnswersByCategory
        )
            .sort((a, b) => b.correct - a.correct)
            .slice(0, 5);

        // Format attempts per category for chart data
        const attemptsPerCategory = Object.keys(categoryAttempts).map((key) => {
            const [topic, category] = key.split(" - ");
            return { topic, category, attempts: categoryAttempts[key] };
        });

        // Format correct vs. incorrect answers per category for chart data
        const correctIncorrectChartData = Object.values(
            correctIncorrectPerCategory
        );

        // Format attempts per topic for chart data
        const attemptsPerTopicData = Object.keys(topicAttempts).map(
            (topic) => ({
                topic,
                attempts: topicAttempts[topic],
            })
        );

        // Send the single values and chart data
        res.status(200).json({
            singleValues: {
                totalQuizzes,
                averageScore,
                overallAccuracy,
                mostAttemptedCategory,
            },
            chartData: {
                scoreDistribution,
                accuracyOverTime,
                attemptsPerCategory,
                correctIncorrectChartData,
                attemptsPerTopic: attemptsPerTopicData,
            },
            top5Data: {
                topAverageScoreTopics: scoreDistribution,
                topMostAttemptedCategories,
                topCategoriesByCorrectAnswers,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAdminQuizAnalytics = async (req, res) => {
    try {
        const quizRecords = await QuizRecord.find()
            .populate("user") // Populate the user to access user information
            .populate("quiz"); // Populate the quiz to access the topic

        if (!quizRecords || quizRecords.length === 0) {
            return res.status(404).json({ message: "No quiz records found" });
        }

        // Initialize accumulators
        let totalAttempts = 0;
        let totalScore = 0;
        let totalCorrectAnswers = 0;
        let totalQuestions = 0;
        const topicScoreDistribution = {}; // For topic-based average score distribution
        const accuracyOverTime = [];
        const categoryAttempts = {};
        const correctAnswersByCategory = {}; // For top categories by correct answers
        const topicAttempts = {};
        const correctIncorrectPerCategory = {};
        const userPerformance = {}; // To track performance per user

        // Process each quiz record and its attempts
        quizRecords.forEach((record) => {
            // Track user performance for top 5 users
            const userId = record.user._id.toString();
            if (!userPerformance[userId]) {
                userPerformance[userId] = {
                    userId: record.user._id,
                    userName: record.user.name,
                    totalScore: 0,
                    totalAttempts: 0,
                };
            }

            // Aggregate data from each attempt
            record.attempts.forEach((attempt) => {
                totalAttempts += 1;
                totalScore += attempt.score;
                totalCorrectAnswers += attempt.correctAnswers;
                totalQuestions += record.totalQuestions;

                // Update user performance
                userPerformance[userId].totalScore += attempt.score;
                userPerformance[userId].totalAttempts += 1;

                // Group scores by topic
                const topic = record.quiz.topic;
                if (!topicScoreDistribution[topic]) {
                    topicScoreDistribution[topic] = {
                        totalScore: 0,
                        count: 0, // Track the number of attempts for averaging
                    };
                }
                topicScoreDistribution[topic].totalScore += attempt.score;
                topicScoreDistribution[topic].count += 1;

                // Accuracy over time for each attempt
                accuracyOverTime.push({
                    date: attempt.date,
                    accuracy: attempt.accuracy,
                    topic: record.quiz.topic,
                    category: record.categoryName,
                });

                // Track attempts per category
                const categoryKey = `${record.quiz.topic} - ${record.categoryName}`;
                categoryAttempts[categoryKey] =
                    (categoryAttempts[categoryKey] || 0) + 1;

                // Track correct answers per category for top 5 categories by correct answers
                if (!correctAnswersByCategory[categoryKey]) {
                    correctAnswersByCategory[categoryKey] = {
                        topic: record.quiz.topic,
                        category: record.categoryName,
                        correct: 0,
                    };
                }
                correctAnswersByCategory[categoryKey].correct +=
                    attempt.correctAnswers;

                // Track correct vs. incorrect answers per category
                if (!correctIncorrectPerCategory[categoryKey]) {
                    correctIncorrectPerCategory[categoryKey] = {
                        topic: record.quiz.topic,
                        category: record.categoryName,
                        correct: 0,
                        incorrect: 0,
                    };
                }
                correctIncorrectPerCategory[categoryKey].correct +=
                    attempt.correctAnswers;
                correctIncorrectPerCategory[categoryKey].incorrect +=
                    attempt.incorrectAnswers;

                // Track attempts per topic
                topicAttempts[record.quiz.topic] =
                    (topicAttempts[record.quiz.topic] || 0) + 1;
            });
        });

        // Calculate single values
        const totalQuizzes = quizRecords.length;
        const averageScore = (totalScore / totalAttempts).toFixed(2);
        const overallAccuracy = (
            (totalCorrectAnswers / totalQuestions) *
            100
        ).toFixed(2);
        const mostAttemptedCategory = Object.keys(categoryAttempts).reduce(
            (a, b) => (categoryAttempts[a] > categoryAttempts[b] ? a : b)
        );

        // Convert topic score distribution to an array with average scores
        let scoreDistribution = Object.entries(topicScoreDistribution).map(
            ([topic, data]) => ({
                topic,
                averageScore: (data.totalScore / data.count).toFixed(2), // Calculate average score
            })
        );

        // Sort by average score in descending order and take the top 5
        scoreDistribution = scoreDistribution
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 5);

        // Sort and select top 5 most attempted categories
        const topMostAttemptedCategories = Object.entries(categoryAttempts)
            .map(([key, attempts]) => {
                const [topic, category] = key.split(" - ");
                return { topic, category, attempts };
            })
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 5);

        // Sort and select top 5 categories by correct answers
        const topCategoriesByCorrectAnswers = Object.values(
            correctAnswersByCategory
        )
            .sort((a, b) => b.correct - a.correct)
            .slice(0, 5);

        // Calculate top 5 users by average score
        const topUsersByPerformance = Object.values(userPerformance)
            .map((user) => ({
                userId: user.userId,
                userName: user.userName,
                avgScore: (user.totalScore / user.totalAttempts).toFixed(2),
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 5);

        // Format attempts per category for chart data
        const attemptsPerCategory = Object.keys(categoryAttempts).map((key) => {
            const [topic, category] = key.split(" - ");
            return { topic, category, attempts: categoryAttempts[key] };
        });

        // Format correct vs. incorrect answers per category for chart data
        const correctIncorrectChartData = Object.values(
            correctIncorrectPerCategory
        );

        // Format attempts per topic for chart data
        const attemptsPerTopicData = Object.keys(topicAttempts).map(
            (topic) => ({
                topic,
                attempts: topicAttempts[topic],
            })
        );

        // Send the single values and chart data
        res.status(200).json({
            singleValues: {
                totalQuizzes,
                averageScore,
                overallAccuracy,
                mostAttemptedCategory,
            },
            chartData: {
                scoreDistribution,
                accuracyOverTime,
                attemptsPerCategory,
                correctIncorrectChartData,
                attemptsPerTopic: attemptsPerTopicData,
            },
            top5Data: {
                topAverageScoreTopics: scoreDistribution,
                topMostAttemptedCategories,
                topCategoriesByCorrectAnswers,
                topUsersByPerformance,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

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
    getUserQuizRecord,
    getAdminQuizAnalytics
};
