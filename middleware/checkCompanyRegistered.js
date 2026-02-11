const CompanyLogin = require("../models/companylogin");

const checkCompanyRegistered = async (req, res, next) => {
    try {
        const { email } = req.body;

        const company = await CompanyLogin.findOne({ email });
        if (!company) {
            req.flash("error", "Company not registered. Please register first.");
            return res.redirect("/company/login1");
        }

        req.company = company; // attach company to request
        next();
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/company/login1");
    }
};

module.exports = checkCompanyRegistered;
