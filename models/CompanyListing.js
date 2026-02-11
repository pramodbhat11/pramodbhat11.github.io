const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanyListingSchema = new Schema({

  companyName: {
    type: String,
    required: true
  },

  wastetypeRequired: {
    type: String,
    required: true
  },

  requiredQuantity: {
    type: Number,
    required: true
  },

  offeredPrice: {
    type: Number,
    required: false
  },

  location: {
    type: String,
    required: true
  },

  contactEmail: {
    type: String,
    required: true
  },

  contactPhone: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("CompanyListing", CompanyListingSchema);
