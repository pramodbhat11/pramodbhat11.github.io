const dotenv = require('dotenv');
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const mongoose = require('mongoose');
const PendingUser = require('./models/pendinguser');

// Connect to MongoDB using .env variable
mongoose.connect(process.env.MONGOURL)
    .then(async () => {
        console.log("Connected to DB");
        const pending = await PendingUser.find({});
        console.log("Pending Users Found:", pending.length);
        if (pending.length > 0) {
            console.log("First pending user email:", pending[0].email);
            console.log("OTP for this user:", pending[0].otp);
        } else {
            console.log("No pending users found. Registration might be failing before save.");
        }
        process.exit();
    })
    .catch(err => console.error(err));
