const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    type: {
        type: String,
        enum: ['REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'NEW_MESSAGE', 'ORDER_UPDATE'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: Schema.Types.ObjectId, // RequestId or OrderId
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Notification", notificationSchema);
