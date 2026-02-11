const dotenv = require('dotenv');
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const mongoose = require("mongoose");
const FarmersListing = require("./models/FarmersListing");

// MongoDB Connect
mongoose.connect(process.env.MONGOURL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

const seedPrices = async () => {
    try {
        const listings = await FarmersListing.find({});
        console.log(`Found ${listings.length} listings.`);

        let updatedCount = 0;
        for (let listing of listings) {
            if (!listing.price || listing.price === 0) {
                // Generate random price between 10 and 100
                const randomPrice = Math.floor(Math.random() * 90) + 10;
                listing.price = randomPrice;
                await listing.save();
                updatedCount++;
                console.log(`Updated ${listing.wastetype} - ${listing.farmerName} with price: ₹${randomPrice}`);
            }
        }

        console.log(`Successfully updated ${updatedCount} listings.`);
        process.exit();
    } catch (err) {
        console.error("Error updating prices:", err);
        process.exit(1);
    }
};

seedPrices();
