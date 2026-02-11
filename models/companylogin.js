const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const CompanyLoginSchema = new Schema({
    companyName: { type: String, required: true },
    ownerName: { type: String },
    industryType: { type: String },

    email: { type: String, required: true, unique: true },
    googleId: { type: String }, // For Google OAuth
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: true },
    contactNumber: { type: String },

    address: { type: String },
    location: {
        district: { type: String },
        state: { type: String }
    },


    wasteTypesRequired: [{ type: String }],
    minQuantityRequired: { type: Number },

    gstNumber: { type: String },
    companyLicenseNumber: { type: String }

}, { timestamps: true });

// Plugin for passport-local-mongoose to handle authentication
CompanyLoginSchema.plugin(passportLocalMongoose, {
    usernameField: "email"  // Use email as the username field
});

module.exports = mongoose.model("CompanyLogin", CompanyLoginSchema);