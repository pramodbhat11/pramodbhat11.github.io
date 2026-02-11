const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'followerModel'
    },
    followerModel: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    followingId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'followingModel'
    },
    followingModel: {
        type: String,
        required: true,
        enum: ['FarmerLogin', 'CompanyLogin']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only follow another user once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
