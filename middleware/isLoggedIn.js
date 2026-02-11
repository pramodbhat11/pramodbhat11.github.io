// middleware/isLoggedIn.js
module.exports = (req, res, next) => {
    if (!req.session.user) {
        req.flash("error", "Please login to continue");
        return res.redirect("/login");
    }
    next();
};
