const express = require("express");
const checkLogin = require("../middleware/checkLogin");
const singleUpload = require("../middleware/file-upload");
const {
    createUser,
    loginUser,
    getUsers,
    getMe,
    uploadAvatar,
    updateUser,
    changePassword,
} = require("../controller/userController");

const userRouter = express.Router();

userRouter.post("/add", singleUpload, createUser);
userRouter.post("/login", loginUser);
userRouter.get("/all", checkLogin("admin"), getUsers);
userRouter.get("/me", checkLogin("user"), getMe);
userRouter.post("/upload", checkLogin("user"), singleUpload, uploadAvatar);
userRouter.post("/update", checkLogin("user"), updateUser);
userRouter.post("/update-password", checkLogin("user"), changePassword);

module.exports = userRouter;
