const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema({

    challengeDate: {
        type: String,
        required: true,
        unique: true
    },

    subject: {
        type: String,
        required: true
    },

    difficulty: {
        type: String,
        enum: ["easy","medium","hard"]
    },

    rewardXP: {
        type: Number,
        default: 100
    }

});

module.exports = mongoose.model(
    "DailyChallenge",
    dailyChallengeSchema
);