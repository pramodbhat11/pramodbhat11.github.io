const dotenv = require('dotenv');
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const mongoose = require('mongoose');
const FarmerLogin = require('../models/farmerlogin');
const CompanyLogin = require('../models/companylogin');
const Message = require('../models/Message');

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log("Connected to MongoDB");

        // 1. Create Test Users
        console.log("Creating test users...");
        const farmer = new FarmerLogin({
            name: "Test Farmer 123",
            email: "testfarmer123@example.com",
            mobileNumber: "9999999999",
            village: "TestVillage"
        });
        await farmer.save();

        const company = new CompanyLogin({
            companyName: "Test Company XYZ",
            email: "testcompanyxyz@example.com",
            mobileNumber: "8888888888",
            location: { district: "TestDistrict", state: "TestState" }
        });
        await company.save();

        console.log(`Created Farmer: ${farmer._id}`);
        console.log(`Created Company: ${company._id}`);

        // 2. Simulate Sending Message (Farmer -> Company)
        console.log("Simulating Message 1: Farmer -> Company");
        const msg1 = new Message({
            sender_id: farmer._id,
            sender_model: 'FarmerLogin',
            receiver_id: company._id,
            receiver_model: 'CompanyLogin',
            message_text: "Hello Company, do you buy wheat?"
        });
        await msg1.save();
        console.log("Message 1 saved.");

        // 3. Simulate Reply (Company -> Farmer)
        console.log("Simulating Message 2: Company -> Farmer");
        const msg2 = new Message({
            sender_id: company._id,
            sender_model: 'CompanyLogin',
            receiver_id: farmer._id,
            receiver_model: 'FarmerLogin',
            message_text: "Yes, we do. sending details."
        });
        await msg2.save();
        console.log("Message 2 saved.");

        // 4. Verify Conversation List logic for Farmer
        console.log("Verifying Inbox Logic for Farmer...");
        // Mock logic from route
        const farmerMessages = await Message.find({
            $or: [
                { sender_id: farmer._id },
                { receiver_id: farmer._id }
            ],
            is_deleted: false
        }).sort({ timestamp: -1 });

        console.log(`Farmer has ${farmerMessages.length} messages in raw history.`);

        // 5. Verify Unread Count for Farmer (Should be 1, from Company)
        const unreadCount = await Message.countDocuments({
            receiver_id: farmer._id,
            receiver_model: 'FarmerLogin',
            is_read: false,
            is_deleted: false
        });
        console.log(`Farmer Unread Count: ${unreadCount} (Expected: 1)`);

        if (unreadCount !== 1) throw new Error("Unread count verification failed");

        // 6. Verify Fetch Conversation for Farmer with Company
        const chatHistory = await Message.find({
            $or: [
                { sender_id: farmer._id, sender_model: 'FarmerLogin', receiver_id: company._id, receiver_model: 'CompanyLogin' },
                { sender_id: company._id, sender_model: 'CompanyLogin', receiver_id: farmer._id, receiver_model: 'FarmerLogin' }
            ],
            is_deleted: false
        }).sort({ timestamp: 1 });

        console.log(`Chat History Length: ${chatHistory.length} (Expected: 2)`);
        console.log(`First Message: ${chatHistory[0].message_text}`);
        console.log(`Second Message: ${chatHistory[1].message_text}`);

        if (chatHistory.length !== 2) throw new Error("Chat history verification failed");

        // Cleanup
        console.log("Cleaning up test data...");
        await FarmerLogin.deleteOne({ _id: farmer._id });
        await CompanyLogin.deleteOne({ _id: company._id });
        await Message.deleteMany({ _id: { $in: [msg1._id, msg2._id] } });

        console.log("Verification Successful!");
        process.exit(0);

    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
};

runVerification();
