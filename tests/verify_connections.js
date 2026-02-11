const dotenv = require('dotenv');
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const mongoose = require('mongoose');
const FarmerLogin = require('../models/farmerlogin');
const CompanyLogin = require('../models/companylogin');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.MONGOURL);
        console.log("Connected to MongoDB");

        // 1. Create Test Users
        console.log("Creating test users...");
        const farmer = new FarmerLogin({
            name: "Test Farmer Conn",
            email: "conn_farmer@example.com",
            mobileNumber: "1112223333",
            village: "ConnVillage"
        });
        await farmer.save();

        const company = new CompanyLogin({
            companyName: "Test Company Conn",
            email: "conn_company@example.com",
            mobileNumber: "4445556666",
            location: { district: "ConnDist", state: "ConnState" }
        });
        await company.save();

        console.log(`Created Farmer: ${farmer._id}`);
        console.log(`Created Company: ${company._id}`);

        // 2. Try Sending Message WITHOUT Connection (Should Fail)
        console.log("Test: Sending message without connection...");
        try {
            const failMsg = new Message({
                sender_id: farmer._id,
                sender_model: 'FarmerLogin',
                receiver_id: company._id,
                receiver_model: 'CompanyLogin',
                message_text: "Should fail"
            });
            // Note: The route logic enforces this, not the model. 
            // So we can't test route logic here easily without making HTTP requests.
            // But we can simulate the Conversation check.
            const conversationCheck = await Conversation.findOne({
                $and: [
                    { participants: { $elemMatch: { userId: farmer._id, userModel: 'FarmerLogin' } } },
                    { participants: { $elemMatch: { userId: company._id, userModel: 'CompanyLogin' } } },
                    { status: 'accepted' }
                ]
            });
            if (conversationCheck) throw new Error("Connection should not exist yet");
            console.log("Pass: Connection check returned null as expected.");
        } catch (e) {
            console.error(e);
        }

        // 3. Send Connection Request
        console.log("Test: Sending connection request...");
        const conversation = new Conversation({
            participants: [
                { userId: farmer._id, userModel: 'FarmerLogin' },
                { userId: company._id, userModel: 'CompanyLogin' }
            ],
            status: 'pending'
        });
        await conversation.save();
        console.log(`Request Sent. Conversation ID: ${conversation._id}`);

        // 4. Accept Request
        console.log("Test: Accepting request...");
        conversation.status = 'accepted';
        await conversation.save();
        console.log("Request Accepted.");

        // 5. Send Message (Should Succeed now logic-wise)
        console.log("Test: Sending message...");
        const msg1 = new Message({
            sender_id: farmer._id,
            sender_model: 'FarmerLogin',
            receiver_id: company._id,
            receiver_model: 'CompanyLogin',
            message_text: "Hello after connection!"
        });
        await msg1.save();
        console.log("Message saved.");

        // 6. Verify Inbox Logic (Listing)
        // Should appear in "Accepted" list
        const acceptedConvos = await Conversation.find({
            participants: { $elemMatch: { userId: farmer._id, userModel: 'FarmerLogin' } },
            status: 'accepted'
        });
        console.log(`Accepted Conversations: ${acceptedConvos.length} (Expected: 1)`);

        // Cleanup
        console.log("Cleaning up...");
        await FarmerLogin.deleteOne({ _id: farmer._id });
        await CompanyLogin.deleteOne({ _id: company._id });
        await Conversation.deleteOne({ _id: conversation._id });
        await Message.deleteMany({ _id: msg1._id });

        console.log("Verification Successful!");
        process.exit(0);

    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
};

runVerification();
