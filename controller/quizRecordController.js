const QuizRecord = require("../models/QuizRecord");
const Quiz = require("../models/Quiz");
const mongoose = require("mongoose");
const User = require("../models/User");

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

const getUserQuizRecordForCommunity = async (req, res) => {
    try {
        const quizRecords = await QuizRecord.find({ user: req.params.userId })
            .populate("user")
            .populate("quiz"); // Populate the quiz to access the topic

        const user = await User.findById(req.params.userId);

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
            user,
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

const getLeaderboard = async (req, res) => {
    try {
        const { topicCategory } = req.params;
        const [topicName, categoryName] = topicCategory.split(" - ");

        // Step 1: Find the quiz ID and category ID based on topic and category names
        const quiz = await Quiz.findOne({
            topic: topicName,
            "categories.category": categoryName,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz or category not found.",
            });
        }

        // Retrieve the specific category details
        const category = quiz.categories.find(
            (cat) => cat.category === categoryName
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found within the quiz.",
            });
        }

        // Step 2: Find top 10 users based on total points for the quiz and category
        const leaderboard = await QuizRecord.aggregate([
            {
                $match: {
                    quiz: new mongoose.Types.ObjectId(quiz._id),
                    categoryId: new mongoose.Types.ObjectId(category._id),
                },
            },
            // Unwind attempts array to treat each attempt as a separate document
            { $unwind: "$attempts" },
            // Group by user and calculate total points
            {
                $group: {
                    _id: "$user",
                    totalPoints: { $sum: "$attempts.score" },
                },
            },
            // Sort by total points in descending order
            { $sort: { totalPoints: -1 } },
            // Limit to top 10 users
            { $limit: 10 },
            // Populate user details from the User collection
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            // Flatten the user details array
            { $unwind: "$user" },
            // Project the final output structure
            {
                $project: {
                    userId: "$user._id",
                    userName: "$user.name",
                    userAvatar: "$user.avatar",
                    totalPoints: 1,
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: leaderboard,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching leaderboard.",
        });
    }
};

module.exports = {
    createQuizRecord,
    getUserQuizRecord,
    getAdminQuizAnalytics,
    getLeaderboard,
    getUserQuizRecordForCommunity,
};
