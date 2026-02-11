const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sender_id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'sender_model'
    },
    sender_model: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    receiver_id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'receiver_model'
    },
    receiver_model: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    message_text: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Message", MessageSchema);
