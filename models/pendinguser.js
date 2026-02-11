const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PendingUserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Temporarily store plain password for passport registration
    role: { type: String, required: true, enum: ['farmer', 'company'] },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    userData: { type: Object, required: true }, // Store all other fields (name, village, etc.)
    createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 minutes (600 seconds)
});

module.exports = mongoose.model("PendingUser", PendingUserSchema);
