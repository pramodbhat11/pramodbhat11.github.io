const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Request = require("../models/Request");

// Middleware
const checkAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    next();
};

// 1. Get Order Details
router.get("/order/:requestId", checkAuth, async (req, res) => {
    try {
        const order = await Order.findOne({ requestId: req.params.requestId }).populate('requestId');
        if (!order) {
            req.flash("error", "Order not found");
            return res.redirect("/dashboard");
        }
        res.render("order", { order, currentUser: req.user });
    } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
    }
});

// 2. Update Order Status
router.post("/order/:id/update", checkAuth, async (req, res) => {
    try {
        const { status, note } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ error: "Order not found" });

        order.status = status;
        order.timeline.push({ status, note });
        await order.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
