
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sendEmail = require('../utils/sendEmail');

async function testEmail() {
    console.log('Attempting to send test email...');
    console.log('User:', process.env.EMAIL_USER);

    try {
        await sendEmail(
            process.env.EMAIL_USER, // Send to self
            'Test Email from WasteToWealth',
            'If you see this, your email configuration is working correctly!'
        );
        console.log('SUCCESS: Test email sent successfully!');
    } catch (error) {
        console.error('FAILURE: Could not send email.');
        console.error(error);
    }
}

testEmail();
