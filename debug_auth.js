const dotenv = require('dotenv');
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
const mongoose = require('mongoose');
const FarmerLogin = require('./models/farmerlogin');

mongoose.connect(process.env.MONGOURL)
    .then(async () => {
        console.log("Connected to DB");

        // Find a user or create one
        let user = await FarmerLogin.findOne({});
        if (!user) {
            console.log("No user found, creating dummy");
            user = new FarmerLogin({ name: 'Test', email: 'test@test.com', mobileNumber: '123' });
            await user.setPassword('password123'); // Set a known password
            await user.save();
        } else {
            console.log("Found user:", user.email);
            await user.setPassword('password123'); // Ensure password is set
            await user.save();
        }

        console.log("Testing authenticate with WRONG password...");
        try {
            const result = await user.authenticate('wrongpass');
            console.log("Result type:", typeof result);
            console.log("Result value:", result);

            if (result) {
                console.log("Evaluation: Truthy (FAIL if interpreted as boolean)");
            } else {
                console.log("Evaluation: Falsy (SUCCESS if interpreted as boolean)");
            }

        } catch (e) {
            console.log("Error during auth:", e);
        }

        process.exit();
    })
    .catch(err => console.error(err));
