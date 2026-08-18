const mongoose = require("mongoose");
require("dotenv").config();

const Question = require("./models/Question");

const fs = require("fs");

const questions = JSON.parse(
    fs.readFileSync("./data/questions.json", "utf8")
);

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB Connected");

        await Question.deleteMany({});

        await Question.insertMany(questions);

        console.log(`✅ Inserted ${questions.length} questions`);

        process.exit();
    } catch (err) {
        console.error(err);
    }
}

seed();