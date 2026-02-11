const express = require("express");
const router = express.Router();

const CompanyListing = require("../models/CompanyListing");
const CompanyLogin = require("../models/companylogin");
const compauth = require("../middleware/companyauth");
const FarmersListing = require("../models/FarmersListing");

// ================= COMPANY LISTING ROUTES =================

// ⭐ Show all company listings
router.get("/", compauth, async (req, res) => {
    try {
        const allListings = await CompanyListing.find({});
        res.render("indexcompany.ejs", { allListings: allListings, currentUser: req.user });
    } catch (err) {
        console.error("Error fetching company listings:", err);
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
});

// ⭐ Show all company listings (public)
router.get("/all", async (req, res) => {
    try {
        const allListings = await CompanyListing.find({});
        res.render("indexcompany.ejs", { allListings: allListings, currentUser: req.user });
    } catch (err) {
        console.error("Error fetching company listings:", err);
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
});

// ⭐ New listing form
router.get("/new", compauth, (req, res) => {
    res.render("newcompanylisting.ejs", { currentUser: req.user });
});

// ⭐ Create new listing
router.post("/", compauth, async (req, res) => {
    try {
        const { wastetypeRequired, requiredQuantity, location, contactEmail, contactPhone, description } = req.body;

        const newListing = new CompanyListing({
            companyName: req.user.companyName || req.user.name,
            wastetypeRequired,
            requiredQuantity,
            location,
            contactEmail: contactEmail || req.user.email,
            contactPhone,
            description
        });

        await newListing.save();
        req.flash("success", "Company listing created successfully!");
        res.redirect("/companies");
    } catch (error) {
        console.error("Error creating company listing:", error);
        req.flash("error", "Error creating listing: " + error.message);
        res.redirect("/companies/new");
    }
});

// ⭐ Show single listing page
router.get("/:id", async (req, res) => {
    try {
        const listing = await CompanyListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/companies");
        }

        // Find similar company listings based on waste type and location
        const similarListings = await CompanyListing.find({
            _id: { $ne: listing._id }, // Exclude current listing
            wastetypeRequired: { $regex: new RegExp(listing.wastetypeRequired, 'i') }, // Case insensitive match
            location: { $regex: new RegExp(listing.location, 'i') } // Case insensitive location match
        }).limit(5);

        // If no exact matches found, broaden the search to just waste type
        let finalSimilarListings = similarListings;
        if (similarListings.length === 0) {
            const broaderMatches = await CompanyListing.find({
                _id: { $ne: listing._id },
                wastetypeRequired: { $regex: new RegExp(listing.wastetypeRequired, 'i') }
            }).limit(5);
            finalSimilarListings = broaderMatches;
        }

        // Find ALL matching farmer listings where waste type matches (regardless of quantity)
        // but highlight which ones have sufficient quantity
        const matchingFarmers = await FarmersListing.find({
            wastetype: { $regex: new RegExp(listing.wastetypeRequired.replace(/[\-\[\]\{\}\(\)\*\+\?\.\\^\$\|]/g, "\\$&"), 'i') } // Match waste type
        }).sort({ quantity: -1 }); // Sort by quantity descending (highest first)

        res.render("showcompany", { 
            listing: listing, 
            currentUser: req.user,
            similarListings: finalSimilarListings,
            matchingFarmers: matchingFarmers
        });
    } catch (err) {
        console.error("Error fetching company listing:", err);
        req.flash("error", "Error fetching company listing");
        res.redirect("/companies");
    }
});

// ⭐ Edit form
router.get("/:id/edit", compauth, async (req, res) => {
    try {
        const listing = await CompanyListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/companies");
        }

        // Check if logged-in company is the owner
        if (listing.contactEmail !== req.user.email) {
            req.flash("error", "You can only edit your own listings");
            return res.redirect(`/companies/${req.params.id}`);
        }

        res.render("companyedit", { listing, currentUser: req.user });
    } catch (err) {
        console.error("Error accessing edit page:", err);
        req.flash("error", "Error accessing edit page");
        res.redirect("/companies");
    }
});

// ⭐ Update listing
router.put("/:id", compauth, async (req, res) => {
    try {
        const { wastetypeRequired, requiredQuantity, location, contactEmail, contactPhone, description } = req.body;

        const updateData = {
            companyName: req.user.companyName || req.user.name,
            wastetypeRequired,
            requiredQuantity,
            location,
            contactEmail: contactEmail || req.user.email,
            contactPhone,
            description
        };

        await CompanyListing.findByIdAndUpdate(req.params.id, updateData);
        req.flash("success", "Company listing updated successfully!");
        res.redirect("/companies");
    } catch (error) {
        console.error("Error updating company listing:", error);
        req.flash("error", "Error updating listing: " + error.message);
        res.redirect(`/companies/${req.params.id}/edit`);
    }
});

// ⭐ Delete listing
router.delete("/:id", compauth, async (req, res) => {
    try {
        const listing = await CompanyListing.findById(req.params.id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/companies");
        }

        // Check if logged-in company is the owner
        if (listing.contactEmail !== req.user.email) {
            req.flash("error", "You can only delete your own listings");
            return res.redirect(`/companies/${req.params.id}`);
        }

        await CompanyListing.findByIdAndDelete(req.params.id);
        req.flash("success", "Company listing deleted successfully!");
        res.redirect("/companies");
    } catch (err) {
        console.error("Error deleting company listing:", err);
        req.flash("error", "Error deleting listing");
        res.redirect("/companies");
    }
});

module.exports = router;