require('dotenv').config();
const sendEmail = require('./utils/sendEmail');
const fs = require('fs');

async function testEmail() {
    let log = "Starting Test...\n";
    try {
        log += "User: " + process.env.EMAIL_USER + "\n";
        const pass = process.env.EMAIL_PASS || "";
        log += "Pass Length: " + pass.length + "\n";
        log += "Pass First 3: " + pass.substring(0, 3) + "\n";

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            log += "ERROR: Env vars missing\n";
            fs.writeFileSync('debug_output.txt', log);
            return;
        }

        log += "Attempting to send...\n";
        // We need sendEmail to return the error or result, but it swallows it. 
        // I'll modify sendEmail momentarily or just rely on its console output if I could capture it.
        // But since I can't, I will just call it.
        // Wait, sendEmail is async.

        await sendEmail(process.env.EMAIL_USER, "TEST-OTP-123");
        log += "sendEmail returned (check console for actual success/fail if modification made)\n";

    } catch (e) {
        log += "Exception: " + e.message + "\n";
    }
    fs.writeFileSync('debug_output.txt', log);
}

testEmail();
