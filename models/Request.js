const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    listingId: {
        type: Schema.Types.ObjectId,
        required: false,
        refPath: 'listingModel'
    },
    listingModel: {
        type: String,
        required: false,
        enum: ['FarmersListing', 'CompanyListing']
    },
    message: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Request", requestSchema);
