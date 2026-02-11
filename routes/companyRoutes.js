const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const CompanyLogin = require("../models/companylogin");
const compauth = require("../middleware/companyauth");
const FarmersListing = require("../models/FarmersListing");
const checkCompanyRegistered = require("../middleware/checkCompanyRegistered");

// -------------------- LOGIN / REGISTER -------------------- //

// Show login form
router.get("/login", (req, res) => res.render("companylogin.ejs"));
router.get("/login1", (req, res) => res.render("companylogin1.ejs"));

// ---------------- LOGIN ---------------- //
router.post("/login1", checkCompanyRegistered, async (req, res) => {
    try {
        const { password } = req.body;
        const company = req.company;

        const isMatch = await company.comparePassword(password);
        if (!isMatch) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/company/login1");
        }

        // Save session
        req.session.user = {
            id: company._id,
            email: company.email,
            name: company.companyName,
            type: "company"
        };

        req.flash("success", "Company login successful!");
        res.redirect("/");

    } catch (err) {
        console.error(err);
        req.flash("error", "Login failed");
        res.redirect("/company/login1");
    }
});

// ---------------- REGISTER ---------------- //
router.post("/login", async (req, res) => {
    try {
        const {
            companyName, ownerName, industryType,
            email, contactNumber,
            address, district, state,
            wasteTypesRequired, minQuantityRequired,
            gstNumber, companyLicenseNumber,
            password
        } = req.body;

        let company = await CompanyLogin.findOne({ email });

        if (!company) {
            company = new CompanyLogin({
                companyName,
                ownerName,
                industryType,
                email,
                contactNumber,
                address,
                location: { district, state },
                password,
                wasteTypesRequired: Array.isArray(wasteTypesRequired)
                    ? wasteTypesRequired
                    : [wasteTypesRequired],
                minQuantityRequired,
                gstNumber,
                companyLicenseNumber
            });
            await company.save();
        }

        req.session.user = {
            id: company._id,
            type: "company",
            email: company.email,
            name: company.companyName
        };

        req.flash("success", "Company registered/login successful!");
        res.redirect("/company/listings");

    } catch (err) {
        console.error(err);
        res.send("Error creating or logging in company");
    }
});

// ---------------- COMPANY LISTINGS ---------------- //
router.get("/listings", compauth, async (req, res) => {
    try {
        const allistings = await CompanyLogin.find({});
        res.render("indexcompany.ejs", { allistings });
    } catch (err) {
        console.error(err);
        res.send("Error fetching company listings");
    }
});

// Show single listing
router.get("/:id", async (req, res) => {
    try {
        const listing = await CompanyLogin.findById(req.params.id);
        if (!listing) return res.send("Company listing not found");

        const matchingFarmers = await FarmersListing.find({
            quantity: { $gte: listing.minQuantityRequired }
        });

        res.render("showcompany.ejs", { listing, matchingFarmers });
    } catch (err) {
        console.error(err);
        res.send("Error loading company listing");
    }
});

// EDIT listing
router.get("/:id/edit", async (req, res) => {
    const listing = await CompanyLogin.findById(req.params.id);
    if (!listing) return res.send("Company listing not found");
    res.render("companyedit.ejs", { listing });
});

// UPDATE listing
router.put("/listing/:id", async (req, res) => {
    await CompanyLogin.findByIdAndUpdate(req.params.id, req.body);
    req.flash("success", "Company listing updated");
    res.redirect("/company/listings");
});

// DELETE listing
router.delete("/:id", async (req, res) => {
    const listing = await CompanyLogin.findById(req.params.id);



  
    if (listing.email === req.session.user.email) {
          await FarmersListing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted!");
    return res.redirect(`/company/listings`);
      
    }
    req.flash("success", "You are not authorized to delete this listing!");
   return res.redirect(`/company/${req.params.id}`);

  
});

module.exports = router;
