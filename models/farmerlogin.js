const mongoose = require("mongoose");
const schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const FarmerSchema = new schema({
    name: { type: String, required: true },
    village: { type: String },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true },
    googleId: { type: String }, // For Google OAuth
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: true }, // Default true for normal reg, false for Google
    // Note: password field is not needed as passport-local-mongoose adds it automatically
});

FarmerSchema.plugin(passportLocalMongoose, {
    usernameField: "email"  // Use email as the username field
});

module.exports = mongoose.model("FarmerLogin", FarmerSchema);