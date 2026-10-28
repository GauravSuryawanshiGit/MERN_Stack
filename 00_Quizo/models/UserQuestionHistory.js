const mongoose = require("mongoose");

/**
 * UserQuestionHistory Model
 * Tracks canonical question presentation per user or guest.
 * Guarantees persistent question uniqueness across all future quiz sessions.
 */
const userQuestionHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },

    // Stable guest identity for unauthenticated learners
    guestId: {
        type: String,
        trim: true,
        index: true
    },

    // Canonical question presented to this learner
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
        index: true
    },

    // Reference to the QuizAttempt in which this question was assigned
    attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizAttempt",
        index: true
    },

    domain: {
        type: String,
        trim: true,
        index: true
    },

    category: {
        type: String,
        trim: true,
        index: true
    },

    // Exposure status
    status: {
        type: String,
        enum: ["presented", "answered", "skipped", "abandoned"],
        default: "presented",
        index: true
    },

    selectedAnswer: {
        type: String,
        default: null
    },

    isCorrect: {
        type: Boolean,
        default: null
    },

    presentedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    answeredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// CRITICAL UNIQUE CONSTRAINTS:
// A user or guest can never have the same canonical question assigned twice in their history.
// Uses partialFilterExpression unique indexes to support both authenticated users and guests safely.
userQuestionHistorySchema.index(
    { userId: 1, questionId: 1 },
    { unique: true, partialFilterExpression: { userId: { $type: "objectId" } }, name: "uniq_user_question" }
);

userQuestionHistorySchema.index(
    { guestId: 1, questionId: 1 },
    { unique: true, partialFilterExpression: { guestId: { $type: "string" } }, name: "uniq_guest_question" }
);

// High performance lookup indexes for question selection filtering:
userQuestionHistorySchema.index({ userId: 1, domain: 1, category: 1 });
userQuestionHistorySchema.index({ guestId: 1, domain: 1, category: 1 });

module.exports = mongoose.model("UserQuestionHistory", userQuestionHistorySchema);
