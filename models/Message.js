const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        required: true,
        ref: "User", // Replace "User" with the actual name of your User model
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000, // Optional limit on message length
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
