const nodemailer = require("nodemailer");
const fs = require('fs');

const sendEmail = async (email, otp) => {
    try {
        fs.appendFileSync('email_log.txt', `Attempting to send to ${email} with OTP ${otp}\n`);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // App Password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Verification OTP - WasteToWealth",
            text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
            html: `<h3>WasteToWealth Verification</h3>
                   <p>Your OTP is: <strong>${otp}</strong></p>
                   <p>This code expires in 10 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP Email sent successfully to " + email);
        fs.appendFileSync('email_log.txt', "Success sending to " + email + "\n");
    } catch (error) {
        console.error("Error sending email:", error);
        fs.appendFileSync('email_log.txt', "Error sending: " + error.message + "\n");
    }
};

module.exports = sendEmail;
