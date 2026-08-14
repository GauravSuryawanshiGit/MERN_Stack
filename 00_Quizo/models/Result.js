const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    username: String,

    subject: String,

    difficulty: String,

    correct: Number,

    total: Number,

    accuracy: Number,

    timeTaken: Number,

    answers: {
    type: Object,
    default: {}
},

    xp: Number,
    quizTime: {
    type: Number,
    default: 0
}
}, {
    timestamps: true
});

module.exports = mongoose.model("Result", resultSchema);