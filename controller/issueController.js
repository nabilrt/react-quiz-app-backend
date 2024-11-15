const Issue = require("../models/Issue");
const mongoose = require("mongoose");

// Create a new issue
const createIssue = async (req, res) => {
    try {
        const { title, description, quizId, categoryId } = req.body;
        const userId = req.user.userId; // Assuming `user` is added to `req` via authentication middleware

        const newIssue = new Issue({
            title,
            description,
            quizId,
            categoryId,
            userId,
        });

        const savedIssue = await newIssue.save();
        res.status(201).json({
            message: "Issue created successfully",
            issue: savedIssue,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create issue",
            error: error.message,
        });
    }
};

// Get a specific issue by ID
const getAllIssues = async (req, res) => {
    try {
        const issues = await Issue.aggregate([
            {
                $lookup: {
                    from: "categories", // Collection name for the 'Category' model in the database
                    localField: "categoryId", // Field in the 'Issue' model
                    foreignField: "_id", // Field in the 'Category' collection
                    as: "categoryDetails", // Alias for the joined data
                },
            },
            {
                $lookup: {
                    from: "quizzes", // Collection name for the 'Quiz' model in the database
                    let: { quizId: "$quizId", categoryId: "$categoryId" }, // Pass quizId and categoryId
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$quizId"] }, // Match quizId
                                        {
                                            $in: [
                                                "$$categoryId",
                                                "$categories._id", // Match categoryId in quiz categories
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                topic: 1, // Include quiz topic
                                categoryName: {
                                    $arrayElemAt: [
                                        "$categories.category", // Extract category name
                                        {
                                            $indexOfArray: [
                                                "$categories._id",
                                                "$$categoryId",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "quizDetails",
                },
            },
            {
                $lookup: {
                    from: "users", // Collection name for the 'User' model in the database
                    localField: "userId", // Field in the 'Issue' model
                    foreignField: "_id", // Field in the 'User' collection
                    as: "userDetails", // Alias for the joined data
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by most recent
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] }, // Include only the first matched category
                    quizDetails: { $arrayElemAt: ["$quizDetails", 0] }, // Include only the first matched quiz
                    userDetails: { $arrayElemAt: ["$userDetails", 0] }, // Include only the first matched user
                },
            },
        ]);

        if (issues.length === 0) {
            return res.status(404).json({ message: "No issues found" });
        }

        res.status(200).json({
            message: "Issues fetched successfully",
            issues,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch issues",
            error: error.message,
        });
    }
};

// Delete an issue by ID
const deleteIssue = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedIssue = await Issue.findByIdAndDelete(id);

        if (!deletedIssue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.status(200).json({
            message: "Issue deleted successfully",
            issue: deletedIssue,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete issue",
            error: error.message,
        });
    }
};

const updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params; // Get the issue ID from the route parameters
        const { status } = req.body; // Get the new status from the request body

        // Validate status field
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Valid statuses are: ${validStatuses.join(
                    ", "
                )}`,
            });
        }

        // Update the status field only
        const updatedIssue = await Issue.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedIssue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.status(200).json({
            message: "Issue status updated successfully",
            issue: updatedIssue,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update issue status",
            error: error.message,
        });
    }
};

// Get all issues by userId
const getIssuesByUserId = async (req, res) => {
    try {
        const { userId } = req.params; // Assuming userId is passed as a route parameter

        const issues = await Issue.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }, // Match issues for the given userId
            },
            {
                $lookup: {
                    from: "categories", // Collection name for the 'Category' model in the database
                    localField: "categoryId", // Field in the 'Issue' model
                    foreignField: "_id", // Field in the 'Category' collection
                    as: "categoryDetails", // Alias for the joined data
                },
            },
            {
                $lookup: {
                    from: "quizzes", // Collection name for the 'Quiz' model in the database
                    let: { quizId: "$quizId", categoryId: "$categoryId" }, // Pass quizId and categoryId
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$quizId"] }, // Match quizId
                                        {
                                            $in: [
                                                "$$categoryId",
                                                "$categories._id", // Match categoryId in quiz categories
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                topic: 1, // Include quiz topic
                                categoryName: {
                                    $arrayElemAt: [
                                        "$categories.category", // Extract category name
                                        {
                                            $indexOfArray: [
                                                "$categories._id",
                                                "$$categoryId",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "quizDetails",
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by most recent
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] }, // Include only the first matched category
                    quizDetails: { $arrayElemAt: ["$quizDetails", 0] }, // Include only the first matched quiz
                },
            },
        ]);

        if (issues.length === 0) {
            return res
                .status(404)
                .json({ message: "No issues found for this user" });
        }

        res.status(200).json({
            message: "Issues fetched successfully",
            issues,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch issues",
            error: error.message,
        });
    }
};

module.exports = {
    createIssue,
    deleteIssue,
    getAllIssues,
    updateIssueStatus,
    getIssuesByUserId,
};
