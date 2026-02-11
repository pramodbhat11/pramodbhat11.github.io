const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FarmerLogin = require("../models/farmerlogin");
const CompanyLogin = require("../models/companylogin");
require("dotenv").config();

// ================= LOCAL STRATEGIES =================
passport.use("farmer", new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
        const user = await FarmerLogin.findOne({ email: email });
        if (!user) {
            return done(null, false, { message: "Incorrect email." });
        }

        // Block unverified users
        if (user.isVerified === false) {
            return done(null, false, { message: "Please verify your email first. Check your inbox for OTP." });
        }

        // Authenticate using the static method
        const authStatic = FarmerLogin.authenticate();
        authStatic(email, password, (err, authenticatedUser, options) => {
            if (err) return done(err);
            if (!authenticatedUser) {
                return done(null, false, { message: "Incorrect password." });
            }
            return done(null, authenticatedUser);
        });
    } catch (err) {
        return done(err);
    }
}));

passport.use("company", new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
        const user = await CompanyLogin.findOne({ email: email });
        if (!user) {
            return done(null, false, { message: "Incorrect email." });
        }

        // Block unverified users
        if (user.isVerified === false) {
            return done(null, false, { message: "Please verify your email first. Check your inbox for OTP." });
        }

        // Authenticate using the static method
        const authStatic = CompanyLogin.authenticate();
        authStatic(email, password, (err, authenticatedUser, options) => {
            if (err) return done(err);
            if (!authenticatedUser) {
                return done(null, false, { message: "Incorrect password." });
            }
            return done(null, authenticatedUser);
        });
    } catch (err) {
        return done(err);
    }
}));

// ================= GOOGLE STRATEGIES =================

// Helper function to handle Google OAuth callback
const handleGoogleAuth = async (req, accessToken, refreshToken, profile, done, Model, role) => {
    try {
        // 1. Check if user exists with googleId
        let user = await Model.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        // 2. Check if user exists with email (link accounts)
        const email = profile.emails[0].value;
        user = await Model.findOne({ email: email });

        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        // 2.5 Check if email exists in the OTHER model (Prevent dual roles)
        let otherUser = null;
        if (role === 'farmer') {
            otherUser = await CompanyLogin.findOne({ email });
        } else {
            otherUser = await FarmerLogin.findOne({ email });
        }

        if (otherUser) {
            return done(null, false, { message: `Email already registered as ${role === 'farmer' ? 'Company' : 'Farmer'}.` });
        }

        // CHECK INTENT: If action is 'login', we now iterate to allow auto-registration
        // if (req.session.authAction === 'login') {
        //    return done(null, false, { message: "Account not found. Please register first." });
        // }

        // 3. Create new user
        // Note: We might need more info for required fields, setting defaults here
        const newUser = new Model({
            googleId: profile.id,
            email: email,
            isVerified: true, // Google emails are verified
            isProfileCompleted: false, // User needs to fill extra details
            ...(role === 'farmer' ? {
                name: profile.displayName,
                mobileNumber: "PENDING" // Placeholder to satisfy 'required'
            } : {
                companyName: profile.displayName, // Mapping display name to company name
                ownerName: profile.displayName
            })
        });

        await newUser.save();
        return done(null, newUser);
    } catch (err) {
        return done(err, null);
    }
};

// Strategy for Farmers
passport.use("google-farmer", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/farmer/callback",
    passReqToCallback: true
},
    function (req, accessToken, refreshToken, profile, done) {
        handleGoogleAuth(req, accessToken, refreshToken, profile, done, FarmerLogin, 'farmer');
    }
));

// Strategy for Companies
passport.use("google-company", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/company/callback",
    passReqToCallback: true
},
    function (req, accessToken, refreshToken, profile, done) {
        handleGoogleAuth(req, accessToken, refreshToken, profile, done, CompanyLogin, 'company');
    }
));

// ================= SERIALIZATION =================
passport.serializeUser((user, done) => {
    done(null, { id: user.id, model: user.constructor.modelName });
});

passport.deserializeUser(async (obj, done) => {
    try {
        let user;
        if (obj.model === "FarmerLogin") {
            user = await FarmerLogin.findById(obj.id);
        } else if (obj.model === "CompanyLogin") {
            user = await CompanyLogin.findById(obj.id);
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
