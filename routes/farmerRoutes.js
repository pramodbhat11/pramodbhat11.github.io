const express = require("express");
const router = express.Router();

const FarmersListing = require("../models/FarmersListing");
const FarmerLogin = require("../models/farmerlogin");
const farmerauth=require("../middleware/farmerauth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const checkRegistered = require("../middleware/checkRegistered");
const bcrypt = require("bcrypt");
const isLoggedIn = require("../middleware/isLoggedIn");
const newlistingauth=require("../middleware/newlistingauth.js");

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

// ================= ROUTES =================

// ⭐ Login page
router.get("/login", (req, res) => {
    res.render("farmerlogin.ejs");
});


// ⭐ Handle login
router.post(
    "/login",
    checkRegistered, // 👈 middleware FIRST
    async (req, res) => {
        try {
            const { password } = req.body;
            const farmer = req.farmer; // 👈 set by middleware

            // 1️⃣ Check password
            const isMatch = await bcrypt.compare(password, farmer.password);

            if (!isMatch) {
                req.flash("error", "Invalid email or password");
                return res.redirect("/farmer/login");
            }

            // 2️⃣ Create session
            req.session.user = {
                id: farmer._id,
                email: farmer.email,
                name: farmer.farmerName, // ✅ farmer name
                type: "farmer"
            };

            req.flash("success", "Login successful!");
            res.redirect("/");

        } catch (err) {
            console.error(err);
            req.flash("error", "Something went wrong. Please try again.");
            res.redirect("/farmer/login");
        }
    }
);


router.get("/register", (req, res) => {
    res.render("farmer-registration.ejs");
});

// ⭐ Handle registration
router.post("/register", async (req, res) => {
    try {
        const { Farmername, village, mobileNumber, email, password } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const farmer = new FarmerLogin({
            farmerName: Farmername,
            village,
            mobileNumber,
            email,
            password: hashedPassword
        });

        await farmer.save();

        // 🔐 AUTO LOGIN (create session)
        req.session.user = {
    id: farmer._id,
    email: farmer.email,
    type: "farmer",
    name: farmer.farmerName   // 👈 store farmer name
};

        req.flash("success", "Registration successful! Welcome.");
        res.redirect("/farmer/listings");

    } catch (err) {
        console.error(err);
        req.flash("error", "Registration failed");
        res.redirect("/farmer/register");
    }
});







// ⭐ Show all farmers listings
router.get("/listings",farmerauth, async (req, res) => {
    const allistings = await FarmersListing.find({});
    res.render("index.ejs", { allistings, currentUser: req.user });
});

// ⭐ New listing form
router.get("/newlisting", farmerauth,(req, res) => {
    res.render("newlisting.ejs", { currentUser: req.user });
});

// ⭐ Create new listing
router.post("/newlisting", upload.single("image"), async (req, res) => {
    const { wastetype, quantity, location, contactPhone, email } = req.body;

    const newlisting = new FarmersListing({
        farmerName: req.user.name,  // Get from authenticated user
        wastetype,
        quantity,
        location,
        contactPhone: req.user.mobileNumber,  // Get from authenticated user
        image: "/uploads/" + req.file.filename,
        email: req.user.email  // Get from authenticated user
    });

    await newlisting.save();
    req.flash("success", "Listing created");
    res.redirect("/farmer/listings");
});






// ⭐ Show single listing page
router.get("/:id",farmerauth, async (req, res) => {
    const listing = await FarmersListing.findById(req.params.id);
    res.render("show.ejs", { listing, currentUser: req.user });
});

// ⭐ Edit form
router.get("/:id/edit", farmerauth, async (req, res) => {
    const listing = await FarmersListing.findById(req.params.id);
    

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/farmer/listings");
    }

    // check if logged-in farmer is the owner
    if (listing.email === req.user.email) {
        return res.render("edit.ejs", { listing, currentUser: req.user });
    }

    req.flash("success", "You are not authorized to edit this listing!");
    return res.redirect(`/farmer/${req.params.id}`);
});

// ⭐ Update listing
router.put("/:id", upload.single("image"), async (req, res) => {
    const { wastetype, quantity, location, contactPhone } = req.body;
    const updateData = { 
        farmerName: req.user.name,  // Get from authenticated user
        wastetype, 
        quantity, 
        location, 
        contactPhone: req.user.mobileNumber,  // Get from authenticated user
        email: req.user.email  // Ensure email is updated from authenticated user
    };

    // If new image uploaded → replace old one
    if (req.file) {
        updateData.image = "/uploads/" + req.file.filename;
    }

    await FarmersListing.findByIdAndUpdate(req.params.id, updateData);
    req.flash("success", "Listing updated!");
    res.redirect("/farmer/listings");
});

// ⭐ Delete listing
router.delete("/:id", async (req, res) => {
    const listing = await FarmersListing.findById(req.params.id);

    // Remove image file
    if (listing && listing.image) {
        const filepath = path.join(__dirname, "..", "public", listing.image);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }

       // check if logged-in farmer is the owner
    if (listing.email === req.user.email) {
          await FarmersListing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted!");
    return res.redirect(`/farmer/listings`);
      
    }
    req.flash("success", "You are not authorized to delete this listing!");
   return res.redirect(`/farmer/${req.params.id}`);

  
});

// ================= LOGIN ROUTES =================





module.exports = router;
