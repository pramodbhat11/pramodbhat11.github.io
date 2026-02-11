const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'participants.userModel'
        },
        userModel: {
            type: String,
            required: true,
            enum: ['FarmerLogin', 'CompanyLogin']
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    lastMessage: {
        type: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for finding conversations for a specific user
ConversationSchema.index({ "participants.userId": 1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
