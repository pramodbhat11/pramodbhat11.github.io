const express = require("express");
const router = express.Router();
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const FarmersListing = require("../models/FarmersListing");
const FarmerLogin = require("../models/farmerlogin");
const CompanyListing = require("../models/CompanyListing");
const CompanyLogin = require("../models/companylogin");
const { farmerAuth } = require("../middleware");
const imagekit = require("../utils/imagekit");

const PendingUser = require("../models/pendinguser");
const Conversation = require("../models/Conversation");
const sendEmail = require("../utils/sendEmail");

// Configure multer for file uploads (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ================= AUTH ROUTES =================

// Login Routes
router.get("/farmer/login", (req, res) => {
    res.render("farmerlogin");
});

router.post("/farmer/login", passport.authenticate("farmer", {
    failureRedirect: "/farmer/login",
    failureFlash: true
}), (req, res) => {
    req.flash("success", "Welcome back, farmer!");
    res.redirect("/farmers");
});

// Registration Routes
router.get("/farmer/register", (req, res) => {
    res.render("farmer-registration");
});

router.post("/farmer/register", async (req, res, next) => {
    try {
        const { name, mobileNumber, password, confirmPassword } = req.body;
        const email = req.body.email.toLowerCase();

        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/farmer/register");
        }

        // Check if user already exists
        const existingUser = await FarmerLogin.findOne({ email });
        const existingCompany = await CompanyLogin.findOne({ email });

        if (existingUser || existingCompany) {
            req.flash("error", "Email already registered. Please login.");
            return res.redirect("/farmer/login");
        }

        // Create new user directly
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create Pending User
        const pendingUser = new PendingUser({
            email,
            password, // Store plain password temporarily strictly for verification flow
            role: 'farmer',
            otp,
            otpExpires,
            userData: {
                name,
                mobileNumber,
                email, // duplicating email in userData for ease
                isVerified: true
                // Removed isProfileCompleted: true so they might go through complete flow if needed,
                // but checking google auth flow, maybe set it to true if we trust registration form enough.
                // The prompt "remove unnecessary fields" implies we want it simple.
                // Existing code set isProfileCompleted: true. Let's keep it true.
            }
        });

        // Ensure userData has isProfileCompleted
        pendingUser.userData.isProfileCompleted = true;

        await pendingUser.save();

        // Send OTP Email
        await sendEmail(email, otp);

        req.flash("success", "OTP sent to your email. Please verify to complete registration.");
        res.redirect(`/verify-otp?email=${email}&role=farmer`);

    } catch (err) {
        console.error("Farmer registration error:", err);
        req.flash("error", err.message);
        res.redirect("/farmer/register");
    }
});

// Complete Google Profile (Farmer)
router.get("/farmer/register/complete", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/farmer/login");
    res.render("farmer-google-complete", { currentUser: req.user });
});

router.post("/farmer/register/complete", async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.redirect("/farmer/login");

        const { mobileNumber, village } = req.body;

        const user = await FarmerLogin.findById(req.user._id);
        user.mobileNumber = mobileNumber;
        user.village = village;

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

        await user.save();

        // Send OTP
        await sendEmail(user.email, otp);

        req.flash("success", "OTP sent to your email. Please verify to complete profile.");
        res.redirect("/farmer/verify-complete");

    } catch (error) {
        console.error("Profile completion error:", error);
        req.flash("error", "Error updating profile.");
        res.redirect("/farmer/register/complete");
    }
});

// Verify Profile Completion OTP
router.get("/farmer/verify-complete", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/farmer/login");
    res.render("otp-verify", {
        email: req.user.email,
        role: 'farmer',
        action: '/farmer/verify-complete'
    });
});

router.post("/farmer/verify-complete", async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.redirect("/farmer/login");

        const { otp } = req.body;
        const user = await FarmerLogin.findById(req.user._id);

        if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            req.flash("error", "Invalid or expired OTP");
            return res.redirect("/farmer/verify-complete");
        }

        // OTP Valid
        user.isProfileCompleted = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        req.flash("success", "Profile verified! Welcome farmer.");
        res.redirect("/farmers");

    } catch (error) {
        console.error("Verification error:", error);
        req.flash("error", "Verification failed");
        res.redirect("/farmer/verify-complete");
    }
});

// ================= LISTING ROUTES =================

// Public Listings (All)
router.get("/farmers/all", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetype = { $regex: search, $options: "i" };
        }
        const listings = await FarmersListing.find(query);
        res.render("index", { allListings: listings, currentUser: req.user, search });
    } catch (err) {
        console.error("Error fetching farmer listings:", err);
        res.redirect("/");
    }
});

// Another public route for listings
router.get("/farmer/listings", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetype = { $regex: search, $options: "i" };
        }
        const listings = await FarmersListing.find(query);
        let suggestedListings = [];
        if (listings.length === 0 && search) {
            suggestedListings = await FarmersListing.find({}).sort({ createdAt: -1 }).limit(3);
        }
        res.render("index", { allListings: listings, currentUser: req.user, search, suggestedListings });
    } catch (err) {
        console.error("Error fetching farmer listings:", err);
        res.redirect("/");
    }
});

// Restricted Listings (Logged in)
router.get("/farmers", async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please login to view listings");
        return res.redirect("/login");
    }
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetype = { $regex: search, $options: "i" };
        }
        const listings = await FarmersListing.find(query);
        res.render("index", { allListings: listings, currentUser: req.user, search });
    } catch (err) {
        console.error("Error fetching farmer listings:", err);
        res.redirect("/");
    }
});

// New Listing Form
router.get("/farmers/new", farmerAuth, (req, res) => {
    res.render("newlisting", { currentUser: req.user });
});

// Create Listing
router.post("/farmers", farmerAuth, upload.single("image"), async (req, res) => {
    try {
        const { wastetype, quantity, price, location, farmerName, contactPhone, email } = req.body;

        if (!req.file) {
            req.flash("error", "Image upload is required");
            return res.redirect("/farmers/new");
        }

        const finalFarmerName = farmerName || req.user.name;
        const finalContactPhone = contactPhone || req.user.mobileNumber;
        const finalEmail = email || req.user.email;

        if (!finalFarmerName) {
            req.flash("error", "Farmer name is required. Please enter your name.");
            return res.redirect("/farmers/new");
        }

        if (!finalContactPhone) {
            req.flash("error", "Contact phone is required. Please enter your phone number.");
            return res.redirect("/farmers/new");
        }

        if (!finalEmail) {
            req.flash("error", "Email is required. Please enter your email.");
            return res.redirect("/farmers/new");
        }

        // Upload to ImageKit
        try {
            const result = await imagekit.upload({
                file: req.file.buffer, // upload the buffer
                fileName: "farmer_" + Date.now() + path.extname(req.file.originalname),
                folder: "/wastetowealth/farmers/"
            });

            const newListing = new FarmersListing({
                farmerName: finalFarmerName,
                wastetype,
                quantity,
                price,
                location,
                contactPhone: finalContactPhone,
                email: finalEmail,
                image: result.url // Use the ImageKit URL
            });

            await newListing.save();
            req.flash("success", "Listing created successfully!");
            res.redirect("/farmers");

        } catch (uploadObjErr) {
            console.error("ImageKit upload error:", uploadObjErr);
            req.flash("error", "Error uploading image to cloud.");
            return res.redirect("/farmers/new");
        }

    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Error creating listing: " + error.message);
        res.redirect("/farmers/new");
    }
});

// Match Logic Route
router.get("/farmers/match/:id", async (req, res) => {
    try {
        const currentListing = await FarmersListing.findById(req.params.id);

        if (!currentListing) {
            req.flash("error", "Listing not found");
            return res.redirect("/farmers");
        }

        const similarListings = await FarmersListing.find({
            _id: { $ne: currentListing._id },
            wastetype: { $regex: new RegExp(currentListing.wastetype, 'i') },
            location: { $regex: new RegExp(currentListing.location, 'i') }
        }).limit(5);

        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await FarmersListing.find({
                _id: { $ne: currentListing._id },
                wastetype: { $regex: new RegExp(currentListing.wastetype, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        const matchingCompanies = await CompanyListing.find({
            wastetypeRequired: { $regex: new RegExp(currentListing.wastetype, 'i') }
        }).sort({ requiredQuantity: -1 });

        res.render("show", {
            listing: currentListing,
            currentUser: req.user,
            similarListings: finalSimilarListings,
            matchingCompanies: matchingCompanies
        });
    } catch (err) {
        console.error("Error finding matching listings:", err);
        req.flash("error", "Error finding matching listings");
        res.redirect("/farmers");
    }
});

// Show Listing
router.get("/farmers/:id", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash("error", "Please login to view listing details");
            return res.redirect("/login");
        }

        const listing = await FarmersListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/farmers");
        }

        const similarListings = await FarmersListing.find({
            _id: { $ne: listing._id },
            wastetype: { $regex: new RegExp(listing.wastetype, 'i') },
            location: { $regex: new RegExp(listing.location, 'i') }
        }).limit(5);

        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await FarmersListing.find({
                _id: { $ne: listing._id },
                wastetype: { $regex: new RegExp(listing.wastetype, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        const matchingCompanies = await CompanyListing.find({
            wastetypeRequired: { $regex: new RegExp(listing.wastetype, 'i') }
        }).sort({ requiredQuantity: -1 });

        // Logic to find Listing Owner and Connection Status
        let listingOwner = null;
        let connectionStatus = 'none'; // 'none', 'pending', 'accepted'
        let conversationId = null;

        if (listing.email) {
            listingOwner = await FarmerLogin.findOne({ email: listing.email });
        }

        if (req.user && listingOwner) {
            // Helper to get model name (dup logic, ideally centralized)
            const getCurrentUserModelName = (u) => {
                if (u.companyName) return 'CompanyLogin';
                if (u.name && u.village) return 'FarmerLogin';
                if (u.constructor.modelName) return u.constructor.modelName;
                return null;
            };

            const currentUserModel = getCurrentUserModelName(req.user);
            // Since listingOwner is FarmerLogin
            const ownerModel = 'FarmerLogin';

            const Request = require('../models/Request');

            // Check for any existing request related to this listing or general connection
            // Check for any existing request related to this SPECIFIC listing
            const existingRequest = await Request.findOne({
                senderId: req.user._id,
                receiverId: listingOwner._id,
                listingId: listing._id
            });

            if (existingRequest) {
                connectionStatus = existingRequest.status; // 'PENDING', 'ACCEPTED', 'REJECTED'
            }
        }

        res.render("show", {
            listing: listing,
            currentUser: req.user,
            similarListings: finalSimilarListings,
            matchingCompanies: matchingCompanies,
            listingOwner,
            connectionStatus,
            conversationId,
            listingOwnerRole: 'FarmerLogin'
        });
    } catch (err) {
        console.error("Error fetching listing:", err);
        req.flash("error", "Error fetching listing");
        res.redirect("/farmers");
    }
});

// Edit Listing Form
router.get("/farmers/:id/edit", farmerAuth, async (req, res) => {
    const listing = await FarmersListing.findById(req.params.id);
    if (listing.email !== req.user.email) {
        req.flash("error", "You can only edit your own listings");
        return res.redirect("/farmers");
    }
    res.render("edit", { listing, currentUser: req.user });
});

// Update Listing
router.put("/farmers/:id", farmerAuth, upload.single("image"), async (req, res) => {
    try {
        const { wastetype, quantity, price, location, farmerName, contactPhone, email } = req.body;

        const finalFarmerName = farmerName || req.user.name;
        const finalContactPhone = contactPhone || req.user.mobileNumber;
        const finalEmail = email || req.user.email;

        if (!finalFarmerName) {
            req.flash("error", "Farmer name is required. Please enter your name.");
            return res.redirect(`/farmers/${req.params.id}/edit`);
        }

        if (!finalContactPhone) {
            req.flash("error", "Contact phone is required. Please enter your phone number.");
            return res.redirect(`/farmers/${req.params.id}/edit`);
        }

        if (!finalEmail) {
            req.flash("error", "Email is required. Please enter your email.");
            return res.redirect(`/farmers/${req.params.id}/edit`);
        }

        let updateData = {
            farmerName: finalFarmerName,
            wastetype,
            quantity,
            price,
            location,
            contactPhone: finalContactPhone,
            email: finalEmail
        };

        if (req.file) {
            // Upload new image to ImageKit
            try {
                const result = await imagekit.upload({
                    file: req.file.buffer,
                    fileName: "farmer_" + Date.now() + path.extname(req.file.originalname),
                    folder: "/wastetowealth/farmers/"
                });
                updateData.image = result.url;
            } catch (uploadObjErr) {
                console.error("ImageKit upload error on update:", uploadObjErr);
                req.flash("error", "Error uploading image to cloud.");
                return res.redirect(`/farmers/${req.params.id}/edit`);
            }
        }

        await FarmersListing.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Listing updated successfully!");
        res.redirect("/farmers");
    } catch (error) {
        console.error("Error updating listing:", error);
        req.flash("error", "Error updating listing: " + error.message);
        res.redirect(`/farmers/${req.params.id}/edit`);
    }
});

// Delete Listing
router.delete("/farmers/:id", farmerAuth, async (req, res) => {
    const listing = await FarmersListing.findById(req.params.id);
    if (listing.email !== req.user.email) {
        req.flash("error", "You can only delete your own listings");
        return res.redirect("/farmers");
    }

    await FarmersListing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/farmers");
});

module.exports = router;
