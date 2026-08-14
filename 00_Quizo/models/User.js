const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: "user"
    },

    xp: {
        type: Number,
        default: 0
    },

    streak: {
        type: Number,
        default: 0
    },

    lastQuizDate: {
        type: Date,
        default: null
    },

    lastChallengeCompleted: {
        type: Date,
        default: null
    },

    totalQuizzes: {
        type: Number,
        default: 0
    },

    totalCorrect: {
        type: Number,
        default: 0
    },

    totalQuestions: {
        type: Number,
        default: 0
    },
    avatar: {
        type: String,
        default: "default-avatar.png"
    },
    bio: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);