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
userRouter.get("/admin", checkLogin("admin"), getMe);
userRouter.post("/upload", checkLogin("user"), singleUpload, uploadAvatar);
userRouter.post(
    "/admin/upload",
    checkLogin("admin"),
    singleUpload,
    uploadAvatar
);
userRouter.post("/update", checkLogin("user"), updateUser);
userRouter.post("/admin/update", checkLogin("admin"), updateUser);
userRouter.post("/update-password", checkLogin("user"), changePassword);
userRouter.post("/admin/update-password", checkLogin("admin"), changePassword);

module.exports = userRouter;
