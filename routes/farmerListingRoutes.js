const express = require("express");
const router = express.Router();

const FarmersListing = require("../models/FarmersListing");
const FarmerLogin = require("../models/farmerlogin");
const farmerauth = require("../middleware/farmerauth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================= MULTER SETUP =================
const uploadPath = path.join(__dirname, "..", "public/uploads");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ================= FARMER LISTING ROUTES =================

// ⭐ Show all farmers listings
router.get("/", farmerauth, async (req, res) => {
    try {
        const allListings = await FarmersListing.find({});
        res.render("index.ejs", { allListings, currentUser: req.user });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
});

// ⭐ Show all farmers listings (public)
router.get("/all", async (req, res) => {
    try {
        const allListings = await FarmersListing.find({});
        res.render("index.ejs", { allListings, currentUser: req.user });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
});

// ⭐ New listing form
router.get("/new", farmerauth, (req, res) => {
    res.render("newlisting.ejs", { currentUser: req.user });
});

// ⭐ Create new listing
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { wastetype, quantity, location, farmerName, contactPhone, email } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            req.flash("error", "Image upload is required");
            return res.redirect("/farmers/new");
        }

        // Use form-provided values if available, otherwise fall back to user profile
        const finalFarmerName = farmerName || req.user.name;
        const finalContactPhone = contactPhone || req.user.mobileNumber;
        const finalEmail = email || req.user.email;

        // Validate that we have all required values
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

        const newListing = new FarmersListing({
            farmerName: finalFarmerName,
            wastetype,
            quantity,
            location,
            contactPhone: finalContactPhone,
            email: finalEmail,
            image: "/uploads/" + req.file.filename
        });

        await newListing.save();
        req.flash("success", "Listing created successfully!");
        res.redirect("/farmers");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Error creating listing: " + error.message);
        res.redirect("/farmers/new");
    }
});

// ⭐ Show single listing page
router.get("/:id", async (req, res) => {
    try {
        const listing = await FarmersListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/farmers");
        }

        // Find similar listings based on waste type and location
        const similarListings = await FarmersListing.find({
            _id: { $ne: listing._id }, // Exclude current listing
            wastetype: { $regex: new RegExp(listing.wastetype, 'i') }, // Case insensitive match
            location: { $regex: new RegExp(listing.location, 'i') } // Case insensitive location match
        }).limit(5);

        // If no exact matches found, broaden the search to just waste type
        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await FarmersListing.find({
                _id: { $ne: listing._id },
                wastetype: { $regex: new RegExp(listing.wastetype, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        // Find matching company listings based on waste type
        // Companies that need this type of waste
        const matchingCompanies = await CompanyListing.find({
            wastetypeRequired: { $regex: new RegExp(listing.wastetype, 'i') } // Match waste type
        }).sort({ requiredQuantity: -1 }); // Sort by required quantity descending

        res.render("show", { 
            listing: listing, 
            currentUser: req.user,
            similarListings: finalSimilarListings,
            matchingCompanies: matchingCompanies
        });
    } catch (err) {
        console.error("Error fetching listing:", err);
        req.flash("error", "Error fetching listing");
        res.redirect("/farmers");
    }
});

// ⭐ Edit form
router.get("/:id/edit", farmerauth, async (req, res) => {
    try {
        const listing = await FarmersListing.findById(req.params.id);
        
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/farmers");
        }

        // Check if logged-in farmer is the owner
        if (listing.email !== req.user.email) {
            req.flash("error", "You can only edit your own listings");
            return res.redirect(`/farmers/${req.params.id}`);
        }

        res.render("edit.ejs", { listing, currentUser: req.user });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error accessing edit page");
        res.redirect("/farmers");
    }
});

// ⭐ Update listing
router.put("/:id", farmerauth, upload.single("image"), async (req, res) => {
    try {
        const { wastetype, quantity, location, farmerName, contactPhone, email } = req.body;

        // Use form-provided values if available, otherwise fall back to user profile
        const finalFarmerName = farmerName || req.user.name;
        const finalContactPhone = contactPhone || req.user.mobileNumber;
        const finalEmail = email || req.user.email;

        // Validate that we have all required values
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
            location,
            contactPhone: finalContactPhone,
            email: finalEmail
        };

        if (req.file) {
            updateData.image = "/uploads/" + req.file.filename;
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

// ⭐ Delete listing
router.delete("/:id", farmerauth, async (req, res) => {
    try {
        const listing = await FarmersListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/farmers");
        }

        // Check if logged-in farmer is the owner
        if (listing.email !== req.user.email) {
            req.flash("error", "You can only delete your own listings");
            return res.redirect(`/farmers/${req.params.id}`);
        }

        // Remove image file
        if (listing && listing.image) {
            const filepath = path.join(__dirname, "..", "public", listing.image);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        await FarmersListing.findByIdAndDelete(req.params.id);
        req.flash("success", "Listing deleted successfully!");
        res.redirect("/farmers");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error deleting listing");
        res.redirect("/farmers");
    }
});

module.exports = router;