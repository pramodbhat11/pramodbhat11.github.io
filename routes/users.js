const express = require("express");
const router = express.Router();
const passport = require("passport");
const FarmerLogin = require("../models/farmerlogin");

const CompanyLogin = require("../models/companylogin");
const PendingUser = require("../models/pendinguser");
const sendEmail = require("../utils/sendEmail");

// General Routes
router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/signup", async (req, res, next) => {
    try {
        const { name, password, confirmPassword } = req.body;
        const email = req.body.email.toLowerCase();

        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/register");
        }

        // Check if email already exists in either farmer or company collections
        const existingFarmer = await FarmerLogin.findOne({ email });
        const existingCompany = await CompanyLogin.findOne({ email });

        if (existingFarmer || existingCompany) {
            req.flash("error", "Email already registered");
            return res.redirect("/register");
        }

        // For a general signup, we'll need to determine user type
        // Since the form doesn't specify, we could redirect to a user type selection
        req.flash("error", "Please select user type (Farmer or Company) from the login page");
        return res.redirect("/login");

    } catch (err) {
        console.error("General signup error:", err);
        req.flash("error", err.message);
        res.redirect("/register");
    }
});

router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out successfully");
        res.redirect("/");
    });
});

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out successfully");
        res.redirect("/");
    });
});

// ================= OTP VERIFICATION ROUTES =================

router.get("/verify-otp", (req, res) => {
    const { role } = req.query;
    const email = req.query.email ? req.query.email.toLowerCase() : '';

    if (!email || !role) {
        req.flash("error", "Missing email or role for verification.");
        return res.redirect("/register");
    }
    res.render("otp-verify", { email, role });
});

router.post("/login/otp/verify", async (req, res) => {
    try {
        const { otp, role } = req.body;
        const email = req.body.email.toLowerCase();

        // Find pending user
        const pendingUser = await PendingUser.findOne({ email, role });

        if (!pendingUser) {
            req.flash("error", "Invalid or expired OTP. Please register again.");
            return res.redirect(role === 'farmer' ? '/farmer/register' : '/company/register');
        }

        // Verify OTP
        if (pendingUser.otp !== otp) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect(`/verify-otp?email=${email}&role=${role}`);
        }

        // OTP Valid - Create actual user
        if (role === 'farmer') {
            // Final check for existing company
            const existingCompany = await CompanyLogin.findOne({ email });
            if (existingCompany) {
                req.flash("error", "Email already registered as Company.");
                return res.redirect("/farmer/register");
            }

            const newFarmer = new FarmerLogin({
                ...pendingUser.userData,
                isVerified: true,
                isProfileCompleted: true
            });
            const registeredFarmer = await FarmerLogin.register(newFarmer, pendingUser.password);

            // Login
            req.login(registeredFarmer, async (err) => {
                if (err) throw err;
                await PendingUser.deleteOne({ _id: pendingUser._id });
                req.flash("success", "Welcome to WasteToWealth! Registration successful.");
                res.redirect("/farmers");
            });

        } else if (role === 'company') {
            // Final check for existing farmer
            const existingFarmer = await FarmerLogin.findOne({ email });
            if (existingFarmer) {
                req.flash("error", "Email already registered as Farmer.");
                return res.redirect("/company/register");
            }

            const newCompany = new CompanyLogin({
                ...pendingUser.userData,
                isVerified: true,
                isProfileCompleted: true
            });
            const registeredCompany = await CompanyLogin.register(newCompany, pendingUser.password);

            // Login
            req.login(registeredCompany, async (err) => {
                if (err) throw err;
                await PendingUser.deleteOne({ _id: pendingUser._id });
                req.flash("success", "Welcome to WasteToWealth! Registration successful.");
                res.redirect("/companies");
            });
        }

    } catch (err) {
        console.error("OTP verification error:", err);
        req.flash("error", "Verification failed: " + err.message);
        res.redirect("/register");
    }
});



// ================= GOOGLE OAUTH ROUTES =================

// Farmer Google Auth
// 1. Strict Login
router.get("/auth/google/farmer/login", (req, res, next) => {
    req.session.authAction = 'login';
    next();
}, passport.authenticate("google-farmer", { scope: ["profile", "email"] }));

// 2. Registration (Allow Creation)
router.get("/auth/google/farmer/register", (req, res, next) => {
    req.session.authAction = 'register';
    next();
}, passport.authenticate("google-farmer", { scope: ["profile", "email"] }));

router.get("/auth/google/farmer/callback",
    passport.authenticate("google-farmer", { failureRedirect: "/farmer/login", failureFlash: true }),
    (req, res) => {
        // Clean up session
        delete req.session.authAction;

        if (!req.user.isProfileCompleted) {
            req.flash("info", "Please complete your profile registration.");
            return res.redirect("/farmer/register/complete");
        }
        req.flash("success", "Welcome back, farmer!");
        res.redirect("/farmers");
    }
);

// Company Google Auth
// 1. Strict Login
router.get("/auth/google/company/login", (req, res, next) => {
    req.session.authAction = 'login';
    next();
}, passport.authenticate("google-company", { scope: ["profile", "email"] }));

// 2. Registration (Allow Creation)
router.get("/auth/google/company/register", (req, res, next) => {
    req.session.authAction = 'register';
    next();
}, passport.authenticate("google-company", { scope: ["profile", "email"] }));

router.get("/auth/google/company/callback",
    passport.authenticate("google-company", { failureRedirect: "/company/login1", failureFlash: true }),
    (req, res) => {
        delete req.session.authAction;

        if (!req.user.isProfileCompleted) {
            req.flash("info", "Please complete your profile registration.");
            return res.redirect("/company/register/complete");
        }
        req.flash("success", "Welcome back, company!");
        res.redirect("/companies");
    }
);

module.exports = router;
