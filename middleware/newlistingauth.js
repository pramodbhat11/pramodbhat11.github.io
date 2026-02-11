module.exports.isFarmerLoggedIn = (req, res, next) => {
    if (!req.session.farmer) {
        req.flash("error", "You must be logged in as a Farmer");
        return res.redirect("/farmer/login");
    }
    next();
};
