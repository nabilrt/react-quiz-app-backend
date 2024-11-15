const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res) => {
    try {
        // Ensure required fields are present
        if (!req.body.message || !req.user.userId) {
            return res.status(400).json({
                errors: {
                    common: {
                        msg: "Message content and user ID are required.",
                    },
                },
            });
        }

        // Create a new message document
        const newMessage = new Message({
            userId: req.user.userId, // Sender's user ID
            message: req.body.message, // Message text from the request
            createdAt: new Date(), // Current timestamp
        });

        // Save the message to the database
        const savedMessage = await newMessage.save();

        const user = await User.findById(req.user.userId);

        // Emit the new message to all connected clients via socket.io
        global.io.emit("new_message", {
            message: {
                userId: user,
                username: req.user.username,
                message: req.body.message,
                createdAt: savedMessage.createdAt,
            },
        });

        // Return success response
        return res.status(200).json({
            message: "Message sent successfully!",
            data: {
                message: savedMessage.message,
                userId: user,
            },
        });
    } catch (err) {
        // Handle errors and return error response
        return res.status(500).json({
            errors: {
                common: {
                    msg: err.message,
                },
            },
        });
    }
};

const getAllMessages = async (req, res) => {
    try {
        // Fetch all messages and populate user details
        const messages = await Message.find()
            .populate("userId") // Populates the userId field with name and avatar from the User model
            .sort({ createdAt: 1 }); // Sort messages by creation time (oldest first)

        let activeUsers = new Map();

        // Check if messages exist
        if (!messages || messages.length === 0) {
            return res.status(404).json({
                message: "No messages found",
            });
        }

        // Return the messages in the response
        return res.status(200).json({
            message: "Messages fetched successfully",
            data: messages,
        });
    } catch (err) {
        // Handle errors and return error response
        return res.status(500).json({
            errors: {
                common: {
                    msg: err.message,
                },
            },
        });
    }
};

module.exports = { sendMessage, getAllMessages };
