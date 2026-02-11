const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    requestId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request'
    },
    senderId: {
        type: Schema.Types.ObjectId,
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
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Chat", chatSchema);
