module.exports.farmerAuth = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.constructor.modelName !== "FarmerLogin") {
        req.flash("error", "Please login as a farmer to access this page");
        return res.redirect("/farmer/login");
    }
    next();
};

module.exports.companyAuth = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.constructor.modelName !== "CompanyLogin") {
        req.flash("error", "Please login as a company to access this page");
        return res.redirect("/company/login1"); // Keeping the redirect as seen in app.js
    }
    next();
};

// Generic login check if needed
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};
