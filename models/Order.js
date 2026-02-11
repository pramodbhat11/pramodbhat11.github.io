const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    requestId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Request'
    },
    status: {
        type: String,
        enum: ['ACCEPTED', 'PICKUP_SCHEDULED', 'COMPLETED'],
        default: 'ACCEPTED'
    },
    timeline: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now },
            note: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", orderSchema);
