const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },

    guestId: {
        type: String,
        trim: true,
        index: true
    },

    attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizAttempt",
        index: true
    },

    username: {
        type: String,
        default: "Learner"
    },

    domain: {
        type: String,
        default: "Programming & CS"
    },

    category: {
        type: String,
        required: true,
        index: true
    },

    subject: {
        type: String,
        index: true
    },

    difficulty: {
        type: String,
        default: "easy"
    },

    correct: {
        type: Number,
        required: true
    },

    total: {
        type: Number,
        required: true
    },

    incorrect: {
        type: Number,
        default: 0
    },

    skipped: {
        type: Number,
        default: 0
    },

    accuracy: {
        type: Number,
        required: true
    },

    xp: {
        type: Number,
        default: 0
    },

    quizTime: {
        type: Number,
        default: 0
    },

    timeTaken: {
        type: Number,
        default: 0
    },

    answers: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

resultSchema.index({ userId: 1, createdAt: -1 });
resultSchema.index({ guestId: 1, createdAt: -1 });
resultSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Result", resultSchema);
