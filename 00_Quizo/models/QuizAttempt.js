const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
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

    domain: {
        type: String,
        trim: true,
        default: "Programming & CS"
    },

    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    subject: {
        type: String,
        trim: true
    },

    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy"
    },

    questionCount: {
        type: Number,
        required: true
    },

    durationSeconds: {
        type: Number,
        default: 600 // 10 minutes default
    },

    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    }],

    answers: {
        type: Map,
        of: String,
        default: () => new Map()
    },

    status: {
        type: String,
        enum: ["in_progress", "completed", "abandoned", "timed_out"],
        default: "in_progress",
        index: true
    },

    score: {
        type: Number,
        default: 0
    },

    correctCount: {
        type: Number,
        default: 0
    },

    incorrectCount: {
        type: Number,
        default: 0
    },

    skippedCount: {
        type: Number,
        default: 0
    },

    accuracy: {
        type: Number,
        default: 0
    },

    quizTime: {
        type: Number,
        default: 0
    },

    xpAwarded: {
        type: Number,
        default: 0
    },

    isDailyChallenge: {
        type: Boolean,
        default: false
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    submittedAt: {
        type: Date,
        default: null
    },

    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Result"
    }
}, {
    timestamps: true
});

quizAttemptSchema.index({ userId: 1, status: 1 });
quizAttemptSchema.index({ guestId: 1, status: 1 });
quizAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
