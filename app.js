if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// Models
const FarmerLogin = require("./models/farmerlogin");
const CompanyLogin = require("./models/companylogin");
const FarmersListing = require("./models/FarmersListing");
const CompanyListing = require("./models/CompanyListing");

// Routes
const farmerRoutes = require("./routes/farmers");
const companyRoutes = require("./routes/companies");
const userRoutes = require("./routes/users");

// MongoDB Connect
mongoose.connect(process.env.MONGOURL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static("public"));

// Session + Flash
app.use(session({
  secret: "wasteSecretKey",
  resave: false,
  saveUninitialized: true
}));
app.use(flash());



// Passport setup
// Configuration is handled in config/passport.js
require("./config/passport");

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Home Route
app.get("/", async (req, res) => {
  try {
    const totalFarmers = await FarmersListing.countDocuments({});
    const totalCompanies = await CompanyListing.countDocuments({});

    // Fetch recent 3 company requirements
    const recentRequirements = await CompanyListing.find({}).sort({ _id: -1 }).limit(3);

    res.render("home", {
      currentUser: req.user,
      totalFarmers,
      totalCompanies,
      recentRequirements
    });
  } catch (err) {
    console.error(err);
    res.render("home", { currentUser: req.user, totalFarmers: 0, totalCompanies: 0, recentRequirements: [] });
  }
});

// Use Routes
app.use("/", farmerRoutes);
app.use("/", companyRoutes);
app.use("/", userRoutes);
const aiRoutes = require("./routes/aiRoutes");
app.use("/", aiRoutes);


// Import & Use New Routes (Request, Order)
const requestRoutes = require("./routes/requestRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/", requestRoutes);
app.use("/", orderRoutes);

const followRoutes = require("./routes/followRoutes");
app.use("/", followRoutes);

app.listen(8080, () => console.log("Server running at 8080"));