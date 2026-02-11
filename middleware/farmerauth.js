module.exports = function (req, res, next) {
    if (
        req.isAuthenticated() &&
        req.user &&
        req.user.constructor.modelName === "FarmerLogin"
    ) {
        return next();
    }

    req.flash("error", "Please login first!");
    return res.redirect("/farmer/login");
};