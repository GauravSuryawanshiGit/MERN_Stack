require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const Question = require("./models/Question");
const { seedQuestionBatch } = require("./services/seederService");

async function runSeed() {
    console.log("=== QUIZO IDEMPOTENT QUESTION SEEDING SYSTEM ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);

    try {
        await connectDB();
        console.log("✅ MongoDB Connection Established.");

        // Read dataset (prioritize questions.json or questions_3000.json)
        const dataPath = fs.existsSync(path.join(__dirname, "data/questions.json"))
            ? path.join(__dirname, "data/questions.json")
            : path.join(__dirname, "data/questions_3000.json");

        console.log(`Reading dataset from: ${dataPath}`);
        const rawContent = fs.readFileSync(dataPath, "utf8");
        const questions = JSON.parse(rawContent);

        console.log(`Ingesting ${questions.length} question records...`);

        const startTime = Date.now();
        const report = await seedQuestionBatch(questions, {
            batchSize: 500,
            updateExisting: false,
            onProgress: (done, total) => {
                const pct = Math.round((done / total) * 100);
                console.log(`Progress: ${done}/${total} (${pct}%)`);
            }
        });

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
        const totalInDb = await Question.countDocuments({ isActive: true });

        console.log("\n================ SEED REPORT ================");
        console.log(`Total Records Received:       ${report.totalReceived}`);
        console.log(`Valid Records:                ${report.validCount}`);
        console.log(`In-Batch Duplicates Skipped:  ${report.inBatchDuplicateCount}`);
        console.log(`Already in DB (Skipped):      ${report.dbDuplicateCount}`);
        console.log(`Newly Inserted into DB:       ${report.insertedCount}`);
        console.log(`Total Active Questions in DB: ${totalInDb}`);
        console.log(`Execution Time:               ${durationSec}s`);
        console.log("=============================================");

        if (report.invalidCount > 0) {
            console.warn(`⚠️ Warning: ${report.invalidCount} records were rejected as malformed.`);
        }

        console.log("✅ Question seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal Error during question seeding:", err);
        process.exit(1);
    }
}

runSeed();
