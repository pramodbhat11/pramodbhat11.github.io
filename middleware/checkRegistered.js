const FarmerLogin = require("../models/farmerlogin");

const checkRegistered = async (req, res, next) => {
    try {
        const { email } = req.body;

        // 1️⃣ Check if farmer exists
        const farmer = await FarmerLogin.findOne({ email });

        if (!farmer) {
            req.flash("error", "You are not registered. Please register first.");
            return res.redirect("/farmer/login");
        }

        // 2️⃣ Attach farmer to request
        req.farmer = farmer;

        // 3️⃣ Move to next function (login)
        next();

    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/farmer/login");
    }
};

module.exports = checkRegistered;
