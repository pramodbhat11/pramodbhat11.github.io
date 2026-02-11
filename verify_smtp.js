require('dotenv').config();
const nodemailer = require("nodemailer");

async function verify() {
    console.log("Verifying SMTP Connection...");
    console.log("User:", process.env.EMAIL_USER);
    console.log("Pass (length):", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ SUCCESS! SMTP connection established.");
        console.log("You can now restart your server and use OTP.");
    } catch (error) {
        console.error("❌ FAILED:", error.message);
        if (error.code === 'EAUTH') {
            console.error("Reason: Invalid Credentials. Please check your App Password.");
        }
    }
}

verify();
