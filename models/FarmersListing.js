const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FarmersListingSchema = new Schema({

  farmerName: {
    type: String,
    required: true
  },

  wastetype: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  contactPhone: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  email:
  {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("FarmersListing", FarmersListingSchema);
