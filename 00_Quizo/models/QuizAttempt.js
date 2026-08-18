const mongoose = require("mongoose");

const quizAttemptScema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    questions: [String],

    answers: Object,

    score: Number
}, {
    timestamps: true
});

module.exports("QuizAttemptSchema");