const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./router/userRouter");
const quizRouter = require("./router/quizRouter");
const quizRecordRouter = require("./router/quizRecordRouter");
require("dotenv").config();

const app = express();
app.use(express.json()); // to handle JSON bodies

app.use(cors());

const PORT = 9000;
const MONGO_DB_URL = process.env.MONGODB_DB_URL;

mongoose
    .connect(MONGO_DB_URL, {})
    .then(function () {
        console.log("MongoDB connected");
    })
    .catch(function (error) {
        console.log("MongoDB connection failed", error);
    });

app.use("/user", userRouter);
app.use("/quiz", quizRouter);
app.use("/quiz-record", quizRecordRouter);

app.listen(PORT, function () {
    console.log(`Server started at PORT ${PORT}`);
});
