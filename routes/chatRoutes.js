const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Request = require("../models/Request");

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please login to view chat");
        return res.redirect("/login");
    }
    next();
};

// 1. View Chat Page
router.get("/chat/:requestId", checkAuth, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const currentUserId = req.user._id.toString();

        const request = await Request.findById(requestId)
            .populate('senderId') // Dynamically populated
            .populate('receiverId'); // Dynamically populated

        if (!request) {
            req.flash("error", "Chat not found");
            return res.redirect("/dashboard");
        }

        if (!request.senderId || !request.receiverId) {
            req.flash("error", "Chat participants not found (user may be deleted)");
            return res.redirect("/dashboard");
        }

        // Security Check: Is current user part of this request?
        if (request.senderId._id.toString() !== currentUserId && request.receiverId._id.toString() !== currentUserId) {
            req.flash("error", "Unauthorized access to chat");
            return res.redirect("/dashboard");
        }

        // Determine the "Other User"
        let otherUser;
        if (request.senderId._id.toString() === currentUserId) {
            otherUser = request.receiverId;
        } else {
            otherUser = request.senderId;
        }

        // Load Chat History
        const chats = await Chat.find({ requestId }).sort({ timestamp: 1 });

        res.render("chat", {
            currentUser: req.user,
            request,
            chats,
            otherUser
        });

    } catch (error) {
        console.error("Chat Error:", error);
        req.flash("error", "Error loading chat");
        res.redirect("/dashboard");
    }
});

module.exports = router;
