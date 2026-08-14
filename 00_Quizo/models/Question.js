const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    subject: String,
    topic: String,

    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"]
    },

    question: String,

    options: [String],

    correctAnswer: String,

    explanation: String
}, {
    timestamps: true
});

module.exports = mongoose.model("Question", questionSchema);