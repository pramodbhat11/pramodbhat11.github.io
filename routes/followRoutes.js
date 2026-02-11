const express = require("express");
const router = express.Router();
const Follow = require("../models/Follow");
const FarmerLogin = require("../models/farmerlogin");
const CompanyLogin = require("../models/companylogin");
const FarmersListing = require("../models/FarmersListing");
const CompanyListing = require("../models/CompanyListing");
const { isLoggedIn } = require("../middleware");

// Helper to get user model name
const getModelName = (user) => {
    if (user.companyName) return 'CompanyLogin';
    if (user.name) return 'FarmerLogin'; // Simplistic check
    return user.constructor.modelName;
};

// 1. Follow User
router.post("/follow/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: "Please login to follow" });
    }

    try {
        const targetId = req.params.id;
        const { targetModel } = req.body; // 'FarmerLogin' or 'CompanyLogin'
        const currentUserId = req.user._id;
        const currentUserModel = getModelName(req.user);

        if (currentUserId.toString() === targetId.toString()) {
            return res.status(400).json({ success: false, error: "You cannot follow yourself" });
        }

        const existingFollow = await Follow.findOne({
            followerId: currentUserId,
            followingId: targetId
        });

        if (existingFollow) {
            return res.status(400).json({ success: false, error: "Already following this user" });
        }

        const newFollow = new Follow({
            followerId: currentUserId,
            followerModel: currentUserModel,
            followingId: targetId,
            followingModel: targetModel
        });

        await newFollow.save();
        res.json({ success: true, message: "Followed successfully" });

    } catch (error) {
        console.error("Follow Error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// 2. Unfollow User
router.post("/unfollow/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, error: "Please login to unfollow" });
    }

    try {
        const targetId = req.params.id;
        const currentUserId = req.user._id;

        await Follow.findOneAndDelete({
            followerId: currentUserId,
            followingId: targetId
        });

        res.json({ success: true, message: "Unfollowed successfully" });

    } catch (error) {
        console.error("Unfollow Error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// 3. View Profile (Unified) - Redirect /profile to /profile/:id
router.get("/profile", (req, res) => {
    if (req.isAuthenticated()) {
        // Reuse getModelName helper
        const userType = getModelName(req.user);
        return res.redirect(`/profile/${req.user._id}?type=${userType}`);
    }
    req.flash("error", "Please login to view profile");
    res.redirect("/login");
});

// 3. View Profile (Specific ID)
router.get("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const { type } = req.query; // 'FarmerLogin' or 'CompanyLogin'

        let userProfile;
        let listings = [];
        let modelName = '';

        if (type === 'FarmerLogin') {
            userProfile = await FarmerLogin.findById(userId);
            modelName = 'FarmerLogin';
            listings = await FarmersListing.find({ email: userProfile.email });
        } else if (type === 'CompanyLogin') {
            userProfile = await CompanyLogin.findById(userId);
            modelName = 'CompanyLogin';
            listings = await CompanyListing.find({ contactEmail: userProfile.email });
        } else {
            // Fallback strategy: Try to find in Farmer, then Company
            userProfile = await FarmerLogin.findById(userId);
            if (userProfile) {
                modelName = 'FarmerLogin';
                listings = await FarmersListing.find({ email: userProfile.email });
            } else {
                userProfile = await CompanyLogin.findById(userId);
                if (userProfile) {
                    modelName = 'CompanyLogin';
                    listings = await CompanyListing.find({ contactEmail: userProfile.email });
                }
            }
        }

        if (!userProfile) {
            req.flash("error", "User not found");
            return res.redirect("/");
        }

        // Stats
        const followersCount = await Follow.countDocuments({ followingId: userId });
        const followingCount = await Follow.countDocuments({ followerId: userId });

        // Check if current user is following this profile
        let isFollowing = false;
        if (req.isAuthenticated()) {
            const followCheck = await Follow.findOne({
                followerId: req.user._id,
                followingId: userId
            });
            if (followCheck) isFollowing = true;
        }

        res.render("profile", {
            profile: userProfile,
            listings,
            followersCount,
            followingCount,
            isFollowing,
            currentUser: req.user,
            userType: modelName
        });

    } catch (error) {
        console.error("Profile view error:", error);
        req.flash("error", "Error loading profile");
        res.redirect("/");
    }
});

// 4. View Followers List
router.get("/profile/:id/followers", async (req, res) => {
    try {
        const userId = req.params.id;
        const followers = await Follow.find({ followingId: userId }).populate('followerId');
        res.render("follow-list", { title: "Followers", list: followers, type: 'followers', currentUser: req.user });
    } catch (e) {
        console.error(e);
        res.redirect("/");
    }
});

// 5. View Following List
router.get("/profile/:id/following", async (req, res) => {
    try {
        const userId = req.params.id;
        const following = await Follow.find({ followerId: userId }).populate('followingId');
        res.render("follow-list", { title: "Following", list: following, type: 'following', currentUser: req.user });
    } catch (e) {
        console.error(e);
        res.redirect("/");
    }
});

module.exports = router;
