const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz", // Assumes a 'Quiz' model exists
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category", // Assumes a 'Category' model exists
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Assumes a 'User' model exists
            required: true,
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Closed"], // Optional: For issue tracking status
            default: "Open",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Automatically manages `createdAt` and `updatedAt`
    }
);

const Issue = mongoose.model("Issue", issueSchema);

module.exports = Issue;
