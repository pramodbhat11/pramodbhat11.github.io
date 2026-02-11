const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const FarmersListing = require("../models/FarmersListing");
const CompanyListing = require("../models/CompanyListing");
const { isLoggedIn } = require("../middleware"); // Assuming you have an isLoggedIn middleware

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: "Please login to send requests" });
    }
    next();
};

// --- API Endpoints for Ajax/Fetch calls ---

// 1. Send Request
router.post("/request/create", checkAuth, async (req, res) => {
    try {
        const { receiverId, receiverModel, listingId, listingModel, message } = req.body;
        const senderId = req.user._id;
        // Helper to get model name safely
        const getModelName = (u) => {
            if (u.companyName) return 'CompanyLogin';
            if (u.name) return 'FarmerLogin';
            return u.constructor.modelName;
        };
        const senderModel = getModelName(req.user);

        // Prevent self-request (just in case)
        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ success: false, error: "Cannot send request to yourself" });
        }

        // Check if request already exists
        const query = {
            senderId,
            receiverId,
            status: 'PENDING' // Prevent spamming pending requests
        };

        if (listingId) {
            query.listingId = listingId;
        } else {
            // If general request, ensure no pending general request exists
            query.listingId = { $exists: false };
        }

        const existingRequest = await Request.findOne(query);

        if (existingRequest) {
            return res.status(400).json({ success: false, error: "A pending request already exists for this interaction." });
        }

        const newRequest = new Request({
            senderId,
            senderModel,
            receiverId,
            receiverModel,
            listingId,
            listingModel,
            message
        });

        await newRequest.save();

        // TODO: Trigger Notification here (Phase 2)

        res.json({ success: true, message: "Request sent successfully!" });

    } catch (error) {
        console.error("Create Request Error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// 2. Update Request Status (Accept/Reject)
router.post("/request/:id/status", checkAuth, async (req, res) => {
    try {
        const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
        const requestId = req.params.id;
        const userId = req.user._id;

        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        // Only the RECEIVER can accept/reject
        if (request.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, error: "Unauthorized: You are not the receiver." });
        }

        request.status = status;
        await request.save();

        if (status === 'ACCEPTED') {
            try {
                const Order = require("../models/Order");
                const newOrder = new Order({
                    requestId: request._id,
                    status: 'ACCEPTED',
                    timeline: [{ status: 'ACCEPTED', note: 'Request accepted.' }]
                });
                await newOrder.save();
            } catch (err) {
                console.error("Order Creation Error:", err);
                // Don't fail the request update if order creation fails, but log it
            }
        }
        res.json({ success: true, status: request.status });

    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// --- View Routes ---

// 3. User Dashboard (Incoming & Sent Requests)
router.get("/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please login to view dashboard");
        return res.redirect("/login");
    }

    try {
        const userId = req.user._id;

        // Incoming Requests (Where I am the receiver)
        const incomingRequests = await Request.find({ receiverId: userId })
            .populate('senderId') // Dynamically populate based on model is tricky in simple find, may need aggregation or manual fetch if standard populate fails with dynamic ref
            .populate('listingId')
            .sort({ createdAt: -1 });

        // We know populate works if 'refPath' is set correctly in schema.
        // But listingId also has dynamic refPath.

        // Sent Requests (Where I am the sender)
        const sentRequests = await Request.find({ senderId: userId })
            .populate('receiverId')
            .populate('listingId')
            .sort({ createdAt: -1 });

        res.render("dashboard", {
            currentUser: req.user,
            incomingRequests,
            sentRequests
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        req.flash("error", "Error loading dashboard");
        res.redirect("/");
    }
});

module.exports = router;
