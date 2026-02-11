require('dotenv').config();
const mongoose = require('mongoose');
const FarmerLogin = require('./models/farmerlogin');
const CompanyLogin = require('./models/companylogin');

console.log("Checking MongoDB connection...");
console.log("URL:", process.env.MONGOURL);

mongoose.connect(process.env.MONGOURL)
    .then(async () => {
        console.log("✅ Successfully connected to MongoDB!");

        try {
            const farmerCount = await FarmerLogin.countDocuments();
            const companyCount = await CompanyLogin.countDocuments();

            console.log(`Farmers found: ${farmerCount}`);
            console.log(`Companies found: ${companyCount}`);

            // List last 3 users to verify recent activity
            const recentFarmers = await FarmerLogin.find().sort({ _id: -1 }).limit(3);
            console.log("\nRecent Farmers:");
            recentFarmers.forEach(f => console.log(`- ${f.email} (${f.name})`));

        } catch (err) {
            console.error("Error querying database:", err);
        } finally {
            mongoose.disconnect();
            console.log("\nConnection closed.");
        }
    })
    .catch(err => {
        console.error("❌ Connection failed:", err);
    });
