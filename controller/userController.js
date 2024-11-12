const bcrypt = require("bcrypt");
const User = require("../models/User");
const cloudinaryConfig = require("../config/cloudinary");
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const file = req.file;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Fill up all the fields",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let avatar = process.env.DEFAULT_AVATAR_URL;
        if (file) {
            const image = await cloudinaryConfig.uploader.upload(file.path, {
                folder: "quiz-app",
            });
            avatar = image.secure_url;
            fs.unlinkSync(file.path);
        }

        const user = new User({
            name,
            email,
            password: hashedPassword,
            avatar,
        });

        await user.save();
        return res.status(201).json({
            message: "User Created",
        });
    } catch (err) {
        return res.status(500).json({
            errors: {
                common: {
                    msg: "Unknown error occurred!",
                },
            },
        });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: "Wrong Password" });
        }

        const token = jwt.sign(
            {
                username: user.name,
                userId: user._id,
                userEmail: user.email,
                avatarUrl: user.avatar,
                role: user.role, // Include the user's role in the token
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Auth Successful",
            token,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find(); // Search users based on the query
        return res.status(200).json({
            users,
            message: "Users returned successfully!",
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId });
        return res.status(200).json({
            message: "User Details",
            user,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const image = await cloudinaryConfig.uploader.upload(file.path, {
            folder: "quiz-app",
        });
        fs.unlinkSync(file.path);
        await User.findByIdAndUpdate(req.user.userId, {
            avatar: image.secure_url,
        });
        const updatedUser = await User.findById(req.user.userId);
        return res.status(200).json({
            message: "User Details Updated",
            user: updatedUser,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name } = req.body;

        await User.findByIdAndUpdate(req.user.userId, {
            name,
        });
        const updatedUser = await User.findById(req.user.userId);
        return res.status(200).json({
            message: "User Details Updated",
            user: updatedUser,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findByIdAndUpdate(req.user.userId, {
            password: hashedPassword,
        });
        const updatedUser = await User.findById(req.user.userId);
        return res.status(200).json({
            message: "User Details Updated",
            user: updatedUser,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createUser,
    loginUser,
    getUsers,
    getMe,
    uploadAvatar,
    updateUser,
    changePassword,
};
