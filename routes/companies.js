const express = require("express");
const router = express.Router();
const passport = require("passport");
const CompanyListing = require("../models/CompanyListing");
const CompanyLogin = require("../models/companylogin");
const FarmersListing = require("../models/FarmersListing");
const FarmerLogin = require("../models/farmerlogin");
const Conversation = require("../models/Conversation");
const { companyAuth } = require("../middleware");
const sendEmail = require("../utils/sendEmail");

// ================= AUTH ROUTES =================

// Login Routes
router.get("/company/login1", (req, res) => {
    res.render("companylogin1");
});

router.post("/company/login1", passport.authenticate("company", {
    failureRedirect: "/company/login1",
    failureFlash: true
}), (req, res) => {
    req.flash("success", "Welcome back, company!");
    res.redirect("/companies");
});

// Registration Routes
router.get("/company/register", (req, res) => {
    res.render("company-registration");
});

const PendingUser = require("../models/pendinguser");

// Direct Registration (No OTP)
router.post("/company/register", async (req, res, next) => {
    try {
        const { companyName, password, confirmPassword } = req.body;
        const email = req.body.email.toLowerCase();

        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/company/register");
        }

        // Check if user already exists
        const existingUser = await CompanyLogin.findOne({ email });
        const existingFarmer = await FarmerLogin.findOne({ email });

        if (existingUser || existingFarmer) {
            req.flash("error", "Email already registered. Please login.");
            return res.redirect("/company/login1");
        }

        // Create new company directly
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create Pending User
        const pendingUser = new PendingUser({
            email,
            password, // Store plain password temporarily
            role: 'company',
            otp,
            otpExpires,
            userData: {
                companyName,
                email,
                isVerified: true,
                isProfileCompleted: true
            }
        });

        await pendingUser.save();

        // Send OTP Email
        await sendEmail(email, otp);

        req.flash("success", "OTP sent to your email. Please verify to complete registration.");
        res.redirect(`/verify-otp?email=${email}&role=company`);

    } catch (err) {
        console.error("Company registration error:", err);
        req.flash("error", err.message);
        res.redirect("/company/register");
    }
});

// Complete Google Profile (Company)
router.get("/company/register/complete", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/company/login1");
    res.render("company-google-complete", { currentUser: req.user });
});

router.post("/company/register/complete", async (req, res) => {
    try {
        if (!req.isAuthenticated()) return res.redirect("/company/login1");

        const { contactNumber, address, industryType } = req.body;

        const user = await CompanyLogin.findById(req.user._id);
        user.contactNumber = contactNumber;
        user.address = address;
        user.industryType = industryType;
        user.isProfileCompleted = true;
        await user.save();

        req.flash("success", "Profile completed! Welcome company.");
        res.redirect("/companies");
    } catch (error) {
        console.error("Profile completion error:", error);
        req.flash("error", "Error updating profile.");
        res.redirect("/company/register/complete");
    }
});

// ================= LISTING ROUTES =================

// Public Listings (All)
router.get("/companies/all", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetypeRequired = { $regex: search, $options: "i" };
        }
        const listings = await CompanyListing.find(query);
        res.render("indexcompany", { allListings: listings, currentUser: req.user, search });
    } catch (err) {
        console.error("Error fetching company listings:", err);
        res.redirect("/");
    }
});

// Another public route for listings
router.get("/company/listings", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetypeRequired = { $regex: search, $options: "i" };
        }
        const listings = await CompanyListing.find(query);
        let suggestedListings = [];
        if (listings.length === 0 && search) {
            suggestedListings = await CompanyListing.find({}).sort({ createdAt: -1 }).limit(3);
        }
        res.render("indexcompany", { allListings: listings, currentUser: req.user, search, suggestedListings });
    } catch (err) {
        console.error("Error fetching company listings:", err);
        res.redirect("/");
    }
});

// Restricted Listings (Logged in)
router.get("/companies", async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please login to view listings");
        return res.redirect("/login");
    }
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.wastetypeRequired = { $regex: search, $options: "i" };
        }
        const listings = await CompanyListing.find(query);
        res.render("indexcompany", { allListings: listings, currentUser: req.user, search });
    } catch (err) {
        console.error("Error fetching company listings:", err);
        res.redirect("/");
    }
});

// New Listing Form
router.get("/companies/new", companyAuth, (req, res) => {
    res.render("newcompanylisting", { currentUser: req.user });
});

// Create Listing
router.post("/companies", companyAuth, async (req, res) => {
    try {
        const { wastetypeRequired, requiredQuantity, offeredPrice, location, contactEmail, contactPhone, description } = req.body;

        const newListing = new CompanyListing({
            companyName: req.user.companyName || req.user.name,
            wastetypeRequired,
            requiredQuantity,
            offeredPrice,
            location,
            contactEmail: contactEmail || req.user.email,
            contactPhone,
            description
        });

        await newListing.save();
        req.flash("success", "Company listing created successfully!");
        res.redirect("/companies");
    } catch (error) {
        req.flash("error", "Error creating listing: " + error.message);
        res.redirect("/companies/new");
    }
});

// Match Logic Route
router.get("/companies/match/:id", async (req, res) => {
    try {
        const currentListing = await CompanyListing.findById(req.params.id);

        if (!currentListing) {
            req.flash("error", "Listing not found");
            return res.redirect("/companies");
        }

        const similarListings = await CompanyListing.find({
            _id: { $ne: currentListing._id },
            wastetypeRequired: { $regex: new RegExp(currentListing.wastetypeRequired, 'i') },
            location: { $regex: new RegExp(currentListing.location, 'i') }
        }).limit(5);

        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await CompanyListing.find({
                _id: { $ne: currentListing._id },
                wastetypeRequired: { $regex: new RegExp(currentListing.wastetypeRequired, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        res.render("showcompany", {
            listing: currentListing,
            currentUser: req.user,
            similarListings: finalSimilarListings
        });
    } catch (err) {
        console.error("Error finding matching company listings:", err);
        req.flash("error", "Error finding matching listings");
        res.redirect("/companies");
    }
});

// Show Listing
router.get("/companies/:id", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            req.flash("error", "Please login to view listing details");
            return res.redirect("/login");
        }

        const listing = await CompanyListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/companies");
        }

        const similarListings = await CompanyListing.find({
            _id: { $ne: listing._id },
            wastetypeRequired: { $regex: new RegExp(listing.wastetypeRequired, 'i') },
            location: { $regex: new RegExp(listing.location, 'i') }
        }).limit(5);

        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await CompanyListing.find({
                _id: { $ne: listing._id },
                wastetypeRequired: { $regex: new RegExp(listing.wastetypeRequired, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        const matchingFarmers = await FarmersListing.find({
            wastetype: { $regex: new RegExp(listing.wastetypeRequired.replace(/[\-\[\]\{\}\(\)\*\+\?\.\\^\$\|]/g, "\\$&"), 'i') }
        }).sort({ quantity: -1 });

        // Logic to find Listing Owner and Connection Status
        let listingOwner = null;
        let connectionStatus = 'none';
        let conversationId = null;

        if (listing.contactEmail) {
            listingOwner = await CompanyLogin.findOne({ email: listing.contactEmail });
        }

        // If email lookup failed, check if we can rely on something else or leave as null.
        // The view handles null listingOwner by preventing the request.

        if (req.user && listingOwner) {
            const getCurrentUserModelName = (u) => {
                if (u.companyName) return 'CompanyLogin';
                if (u.name && u.village) return 'FarmerLogin';
                if (u.constructor.modelName) return u.constructor.modelName;
                return null;
            };

            const currentUserModel = getCurrentUserModelName(req.user);
            const ownerModel = 'CompanyLogin';

            const Request = require('../models/Request');

            // Check for any existing request
            // Check for any existing request related to this SPECIFIC listing
            const existingRequest = await Request.findOne({
                senderId: req.user._id,
                receiverId: listingOwner._id,
                listingId: listing._id
            });

            if (existingRequest) {
                connectionStatus = existingRequest.status;
            }
        }

        res.render("showcompany", {
            listing: listing,
            currentUser: req.user,
            similarListings: finalSimilarListings,
            matchingFarmers: matchingFarmers,
            listingOwner,
            connectionStatus,
            conversationId,
            listingOwnerRole: 'CompanyLogin'
        });
    } catch (err) {
        console.error("Error fetching company listing:", err);
        req.flash("error", "Error fetching company listing");
        res.redirect("/companies");
    }
});

// Edit Listing Form
router.get("/companies/:id/edit", companyAuth, async (req, res) => {
    const listing = await CompanyListing.findById(req.params.id);
    if (listing.contactEmail !== req.user.email) {
        req.flash("error", "You can only edit your own listings");
        return res.redirect("/companies");
    }
    res.render("companyedit", { listing, currentUser: req.user });
});

// Update Listing
router.put("/companies/:id", companyAuth, async (req, res) => {
    try {
        const { wastetypeRequired, requiredQuantity, offeredPrice, location, contactEmail, contactPhone, description } = req.body;

        const updateData = {
            companyName: req.user.companyName || req.user.name,
            wastetypeRequired,
            requiredQuantity,
            offeredPrice,
            location,
            contactEmail: contactEmail || req.user.email,
            contactPhone,
            description
        };

        await CompanyListing.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Company listing updated successfully!");
        res.redirect("/companies");
    } catch (error) {
        req.flash("error", "Error updating listing: " + error.message);
        res.redirect(`/companies/${req.params.id}/edit`);
    }
});

// Delete Listing
router.delete("/companies/:id", companyAuth, async (req, res) => {
    const listing = await CompanyListing.findById(req.params.id);
    if (listing.contactEmail !== req.user.email) {
        req.flash("error", "You can only delete your own listings");
        return res.redirect("/companies");
    }

    await CompanyListing.findByIdAndDelete(req.params.id);
    req.flash("success", "Company listing deleted successfully!");
    res.redirect("/companies");
});

module.exports = router;
