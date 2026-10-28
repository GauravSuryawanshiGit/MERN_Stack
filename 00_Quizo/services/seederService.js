const crypto = require("crypto");
const Question = require("../models/Question");
const { resolveCategory } = require("../config/quizDomains");

/**
 * Normalizes question text for fingerprinting and duplicate detection
 */
function normalizeQuestionText(text) {
    if (!text || typeof text !== "string") return "";
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Generates an idempotent SHA-256 hash of normalized text
 */
function generateQuestionHash(text) {
    const normalized = normalizeQuestionText(text);
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Validates a raw question object before insertion.
 * Returns { isValid: Boolean, data: Object|null, errors: Array }
 */
function validateQuestion(raw, index = 0) {
    const errors = [];
    if (!raw || typeof raw !== "object") {
        return { isValid: false, data: null, errors: ["Record is not a valid JSON object."] };
    }

    // 1. Validate Question Text
    const questionText = (raw.question || "").trim();
    if (!questionText || questionText.length < 5) {
        errors.push("Question prompt is required and must be at least 5 characters.");
    }

    // 2. Validate Options
    let options = raw.options;
    if (typeof options === "string") {
        try {
            options = JSON.parse(options);
        } catch {
            options = options.split(",").map(s => s.trim());
        }
    }
    // Also support opt1, opt2, opt3, opt4 fields from Excel / CSV imports
    if (!Array.isArray(options) || options.length === 0) {
        if (raw.opt1 && raw.opt2) {
            options = [raw.opt1, raw.opt2, raw.opt3, raw.opt4].filter(Boolean);
        }
    }

    if (!Array.isArray(options) || options.length < 2) {
        errors.push("Options must be an array with at least 2 distinct choices.");
    } else {
        options = options.map(opt => String(opt).trim());
        const uniqueOptions = new Set(options);
        if (uniqueOptions.size < options.length) {
            errors.push("Options contains duplicate answer choices.");
        }
    }

    // 3. Validate Correct Answer
    const correctAnswer = (raw.correctAnswer || raw.answer || "").trim();
    if (!correctAnswer) {
        errors.push("Correct answer is required.");
    } else if (Array.isArray(options) && !options.includes(correctAnswer)) {
        // Case-insensitive match attempt
        const matched = options.find(o => o.toLowerCase() === correctAnswer.toLowerCase());
        if (!matched) {
            errors.push(`Correct answer '${correctAnswer}' does not match any of the provided options: [${options.join(", ")}].`);
        }
    }

    // 4. Resolve Domain, Category, Subcategory
    const catInput = raw.category || raw.subject || "General";
    const resolved = resolveCategory(catInput);

    const domain = raw.domain || (resolved ? resolved.domain : "Programming & CS");
    const category = raw.category || (resolved ? resolved.category : catInput);
    const subcategory = raw.subcategory || raw.topic || (resolved && resolved.subcategories ? resolved.subcategories[0] : "General");

    // 5. Validate Difficulty
    let difficulty = (raw.difficulty || "easy").toLowerCase().trim();
    if (!["easy", "medium", "hard"].includes(difficulty)) {
        difficulty = "easy";
    }

    // 6. External ID & Fingerprint
    const normalizedQuestion = normalizeQuestionText(questionText);
    const textHash = generateQuestionHash(questionText);
    const externalId = raw.externalId || `QUIZ-${category.toUpperCase().replace(/\s+/g, "_")}-${textHash.substring(0, 8)}`;

    if (errors.length > 0) {
        return { isValid: false, data: null, errors, index };
    }

    const sanitized = {
        externalId,
        domain,
        category,
        subcategory,
        subject: category, // synced
        topic: subcategory, // synced
        difficulty,
        question: questionText,
        normalizedQuestion,
        textHash,
        options,
        correctAnswer: options.find(o => o.toLowerCase() === correctAnswer.toLowerCase()) || correctAnswer,
        explanation: (raw.explanation || "").trim(),
        tags: Array.isArray(raw.tags) ? raw.tags : (resolved ? resolved.tags : [category.toLowerCase()]),
        questionType: raw.questionType || "single_choice",
        isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true
    };

    return { isValid: true, data: sanitized, errors: [] };
}

/**
 * Idempotently seeds an array of raw questions with validation, duplicate detection, and batch insertion.
 */
async function seedQuestionBatch(questionList, options = {}) {
    const {
        batchSize = 500,
        updateExisting = false,
        onProgress = null
    } = options;

    const report = {
        totalReceived: questionList.length,
        validCount: 0,
        invalidCount: 0,
        inBatchDuplicateCount: 0,
        dbDuplicateCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        invalidDetails: []
    };

    // Step 1: Validate and deduplicate within incoming batch
    const validatedQuestions = [];
    const seenHashesInBatch = new Set();

    for (let i = 0; i < questionList.length; i++) {
        const result = validateQuestion(questionList[i], i);
        if (!result.isValid) {
            report.invalidCount++;
            if (report.invalidDetails.length < 20) {
                report.invalidDetails.push({
                    index: i,
                    question: questionList[i] ? questionList[i].question : "undefined",
                    errors: result.errors
                });
            }
            continue;
        }

        const q = result.data;
        if (seenHashesInBatch.has(q.textHash)) {
            report.inBatchDuplicateCount++;
            continue;
        }

        seenHashesInBatch.add(q.textHash);
        validatedQuestions.push(q);
        report.validCount++;
    }

    console.log(`[Seeder] Validated ${report.validCount} questions. Processing batches of ${batchSize}...`);

    // Step 2: Batch process into MongoDB using bulkWrite
    for (let i = 0; i < validatedQuestions.length; i += batchSize) {
        const batch = validatedQuestions.slice(i, i + batchSize);
        const hashes = batch.map(q => q.textHash);

        // Find which hashes already exist in database
        const existingDocs = await Question.find({ textHash: { $in: hashes } }, { textHash: 1, externalId: 1 }).lean();
        const existingHashSet = new Set(existingDocs.map(d => d.textHash));

        const bulkOps = [];
        for (const q of batch) {
            if (existingHashSet.has(q.textHash)) {
                report.dbDuplicateCount++;
                if (updateExisting) {
                    bulkOps.push({
                        updateOne: {
                            filter: { textHash: q.textHash },
                            update: { $set: q }
                        }
                    });
                }
            } else {
                bulkOps.push({
                    insertOne: {
                        document: q
                    }
                });
            }
        }

        if (bulkOps.length > 0) {
            const bulkRes = await Question.bulkWrite(bulkOps, { ordered: false });
            report.insertedCount += (bulkRes.insertedCount || 0) + (bulkRes.upsertedCount || 0);
            report.updatedCount += (bulkRes.modifiedCount || 0);
        }

        if (typeof onProgress === "function") {
            onProgress(Math.min(i + batchSize, validatedQuestions.length), validatedQuestions.length);
        }
    }

    return report;
}

module.exports = {
    normalizeQuestionText,
    generateQuestionHash,
    validateQuestion,
    seedQuestionBatch
};

