const express = require("express");
const {
    createIssue,
    getAllIssues,
    updateIssueStatus,
    deleteIssue,
    getIssuesByUserId,
} = require("../controller/issueController");
const checkLogin = require("../middleware/checkLogin");

const issueRouter = express.Router();

issueRouter.delete("/:id", deleteIssue);
issueRouter.post("/add", checkLogin("user"), createIssue);
issueRouter.get("/all", checkLogin("admin"), getAllIssues);
issueRouter.put("/:id", checkLogin("admin"), updateIssueStatus);
issueRouter.get("/user/:userId", checkLogin("user"), getIssuesByUserId);

module.exports = issueRouter;
