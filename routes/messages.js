const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const FarmerLogin = require("../models/farmerlogin");
const CompanyLogin = require("../models/companylogin");

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You must be signed in to access messages.");
    res.redirect("/login");
};

// Helper: Get user model name based on instance
const getCurrentUserModelName = (user) => {
    if (user.companyName) return 'CompanyLogin';
    if (user.name && user.village) return 'FarmerLogin'; // Farmer specific
    if (user.constructor.modelName) return user.constructor.modelName;
    return null;
};

// Helper: Find existing conversation
const findConversation = async (userId, userModel, otherId, otherModel) => {
    return await Conversation.findOne({
        $and: [
            { participants: { $elemMatch: { userId: userId, userModel: userModel } } },
            { participants: { $elemMatch: { userId: otherId, userModel: otherModel } } }
        ]
    });
};

// POST /request - Send Connection Request
router.post("/request", isLoggedIn, async (req, res) => {
    try {
        const { receiverId, receiverModel } = req.body;
        const senderId = req.user._id;
        const senderModel = getCurrentUserModelName(req.user);

        // Check if conversation already exists
        let conversation = await findConversation(senderId, senderModel, receiverId, receiverModel);

        if (conversation) {
            if (conversation.status === 'accepted') {
                return res.status(400).json({ success: false, error: "Already connected" });
            } else if (conversation.status === 'pending') {
                return res.status(400).json({ success: false, error: "Request already pending" });
            }
            // If rejected, allow re-request (or handle logic specific to app).
            // For now, let's treat it as a new request if rejected.
            conversation.status = 'pending';
            await conversation.save();
            return res.json({ success: true, message: "Request sent again" });
        }

        // Create new pending conversation
        conversation = new Conversation({
            participants: [
                { userId: senderId, userModel: senderModel },
                { userId: receiverId, userModel: receiverModel }
            ],
            status: 'pending'
        });

        await conversation.save();
        res.json({ success: true, message: "Request sent successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send request" });
    }
});

// POST /accept - Accept Connection Request
router.post("/accept", isLoggedIn, async (req, res) => {
    try {
        const { conversationId } = req.body;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        conversation.status = 'accepted';
        await conversation.save();

        res.json({ success: true, message: "Request accepted" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to accept request" });
    }
});

// POST /reject - Reject/Decline Request
// Using POST instead of DELETE because we might want to keep the record as 'rejected'
router.post("/reject", isLoggedIn, async (req, res) => {
    try {
        const { conversationId } = req.body;
        await Conversation.findByIdAndDelete(conversationId); // Delete to allow fresh start
        res.json({ success: true, message: "Request declined" });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to decline" });
    }
});


// POST /send - Send a message (Enforce Connection)
router.post("/send", isLoggedIn, async (req, res) => {
    try {
        const { receiverId, receiverModel, message } = req.body;
        const senderId = req.user._id;
        const senderModel = getCurrentUserModelName(req.user);

        // 1. Check for Accepted Conversation
        const conversation = await findConversation(senderId, senderModel, receiverId, receiverModel);

        if (!conversation || conversation.status !== 'accepted') {
            return res.status(403).json({ success: false, error: "You must be connected to send messages." });
        }

        const newMessage = new Message({
            sender_id: senderId,
            sender_model: senderModel,
            receiver_id: receiverId,
            receiver_model: receiverModel,
            message_text: message
        });

        await newMessage.save();

        // Update conversation last message
        conversation.lastMessage = message;
        conversation.updatedAt = Date.now();
        await conversation.save();

        res.status(200).json({ success: true, message: "Message sent", data: newMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to send message" });
    }
});

// GET /requests - Get Pending Requests
router.get("/requests", isLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const userModel = getCurrentUserModelName(req.user);

        // Find conversations where I am a participant AND status is pending
        // Ideally we filter out requests *I* sent.
        // But for MVP, if I am a participant and it is pending, show it.
        // We can check who created it if we stored creator, but we didn't.
        // We can just rely on UI context: "Waiting for acceptance" vs "Accept/Decline"

        const pendingConvos = await Conversation.find({
            participants: { $elemMatch: { userId: userId, userModel: userModel } },
            status: 'pending'
        }).sort({ createdAt: -1 });

        // Populate details
        const requests = [];
        for (const conv of pendingConvos) {
            const otherPart = conv.participants.find(p => !p.userId.equals(userId));
            if (!otherPart) continue;

            let OtherModel;
            if (otherPart.userModel === 'FarmerLogin') OtherModel = FarmerLogin;
            else OtherModel = CompanyLogin;

            const user = await OtherModel.findById(otherPart.userId).select('name companyName');
            if (user) {
                requests.push({
                    conversationId: conv._id,
                    otherId: user._id,
                    otherModel: otherPart.userModel,
                    name: user.name || user.companyName,
                    createdAt: conv.createdAt
                });
            }
        }

        res.json({ success: true, requests });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch requests" });
    }
});

// GET /conversations - Get Active Conversations (Accepted only)
router.get("/conversations", isLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const userModel = getCurrentUserModelName(req.user);

        // Find ACCEPTED conversations
        const conversations = await Conversation.find({
            participants: { $elemMatch: { userId: userId, userModel: userModel } },
            status: 'accepted'
        }).sort({ updatedAt: -1 });

        const result = [];

        for (const conv of conversations) {
            const otherPart = conv.participants.find(p => !p.userId.equals(userId));
            let OtherModel;
            if (otherPart.userModel === 'FarmerLogin') OtherModel = FarmerLogin;
            else OtherModel = CompanyLogin;

            const user = await OtherModel.findById(otherPart.userId).select('name companyName');

            // Count unread
            const unreadCount = await Message.countDocuments({
                sender_id: otherPart.userId,
                receiver_id: userId,
                is_read: false,
                is_deleted: false
            });

            if (user) {
                result.push({
                    conversationId: conv._id,
                    otherId: user._id,
                    otherModel: otherPart.userModel,
                    name: user.name || user.companyName,
                    lastMessage: conv.lastMessage,
                    unreadCount,
                    timestamp: conv.updatedAt
                });
            }
        }

        res.json({ success: true, conversations: result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch conversations" });
    }
});

// GET /conversation/:otherUserId - Get chat history
router.get("/conversation/:otherUserId", isLoggedIn, async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const { otherModel } = req.query;
        const userId = req.user._id;
        const senderModel = getCurrentUserModelName(req.user);

        if (!otherModel) {
            return res.status(400).json({ success: false, error: "Model query param required" });
        }

        const messages = await Message.find({
            $or: [
                { sender_id: userId, sender_model: senderModel, receiver_id: otherUserId, receiver_model: otherModel },
                { sender_id: otherUserId, sender_model: otherModel, receiver_id: userId, receiver_model: senderModel }
            ],
            is_deleted: false
        }).sort({ timestamp: 1 });

        // Mark as read
        await Message.updateMany({
            sender_id: otherUserId,
            receiver_id: userId,
            is_read: false
        }, { $set: { is_read: true } });

        res.json({ success: true, messages });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch conversation" });
    }
});

// GET /unread-count - Global unread count
router.get("/unread-count", isLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Message.countDocuments({
            receiver_id: userId,
            is_read: false,
            is_deleted: false
        });
        res.json({ success: true, count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch count" });
    }
});


// VIEW ROUTES
router.get("/inbox", isLoggedIn, (req, res) => {
    res.render("messages/inbox", { currentUser: req.user });
});

router.get("/chat", isLoggedIn, (req, res) => {
    // We expect userId and model in query params
    res.render("messages/chat", { currentUser: req.user });
});

router.get("/requests-view", isLoggedIn, (req, res) => {
    res.render("messages/requests", { currentUser: req.user });
});

module.exports = router;
