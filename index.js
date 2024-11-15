const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./router/userRouter");
const quizRouter = require("./router/quizRouter");
const quizRecordRouter = require("./router/quizRecordRouter");
const issueRouter = require("./router/issueRouter");
const testimonialRouter = require("./router/testimonialRouter");
const chatRouter = require("./router/messageRouter");
const http = require("http");

require("dotenv").config();

const app = express();
app.use(express.json()); // to handle JSON bodies

app.use(cors());

const server = http.createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "*", // you can replace '*' with the allowed domains, e.g., 'http://localhost:3000'
        methods: ["GET", "POST"],
    },
});
global.io = io;

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
app.use("/issue", issueRouter);
app.use("/testimonial", testimonialRouter);
app.use("/chat", chatRouter);

server.listen(PORT, function () {
    console.log(`Server started at PORT ${PORT}`);
});
