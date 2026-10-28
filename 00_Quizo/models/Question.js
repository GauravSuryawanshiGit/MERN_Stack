const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Normalizes question text for fingerprinting and duplicate detection:
 * - Converts to lowercase
 * - Strips all non-alphanumeric punctuation except essential spaces
 * - Normalizes multiple spaces into a single space
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
 * Generates an idempotent SHA-256 fingerprint hash of normalized question text
 */
function generateQuestionHash(text) {
    const normalized = normalizeQuestionText(text);
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

const questionSchema = new mongoose.Schema({
    externalId: {
        type: String,
        trim: true,
        index: true
    },

    domain: {
        type: String,
        trim: true,
        default: "Programming & CS",
        index: true
    },

    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    subcategory: {
        type: String,
        trim: true,
        default: "General"
    },

    // Backward-compatible aliases for legacy codebase:
    subject: {
        type: String,
        trim: true,
        index: true
    },

    topic: {
        type: String,
        trim: true
    },

    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy",
        index: true
    },

    question: {
        type: String,
        required: true,
        trim: true
    },

    normalizedQuestion: {
        type: String,
        trim: true
    },

    textHash: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },

    options: {
        type: [String],
        required: true,
        validate: {
            validator: function(opts) {
                return Array.isArray(opts) && opts.length >= 2;
            },
            message: "A question must contain at least 2 options."
        }
    },

    correctAnswer: {
        type: String,
        required: true,
        trim: true
    },

    explanation: {
        type: String,
        trim: true,
        default: ""
    },

    tags: {
        type: [String],
        default: []
    },

    questionType: {
        type: String,
        enum: ["single_choice", "multiple_choice", "true_false"],
        default: "single_choice"
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Middleware: Sync backward compatibility and compute text hash
questionSchema.pre("save", function(next) {
    // Sync subject <-> category
    if (!this.category && this.subject) {
        this.category = this.subject;
    }
    if (!this.subject && this.category) {
        this.subject = this.category;
    }

    // Sync topic <-> subcategory
    if (!this.subcategory && this.topic) {
        this.subcategory = this.topic;
    }
    if (!this.topic && this.subcategory) {
        this.topic = this.subcategory;
    }

    // Normalize difficulty
    if (this.difficulty) {
        this.difficulty = this.difficulty.toLowerCase();
    }

    // Compute normalized text and hash
    if (this.question) {
        this.normalizedQuestion = normalizeQuestionText(this.question);
        this.textHash = generateQuestionHash(this.question);
    }

    // Trim options and ensure unique elements
    if (Array.isArray(this.options)) {
        this.options = this.options.map(opt => String(opt).trim());
    }

    next();
});

// Compound indexes for ultra-fast query execution
questionSchema.index({ domain: 1, category: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ subject: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ category: 1, isActive: 1 });

questionSchema.statics.normalizeQuestionText = normalizeQuestionText;
questionSchema.statics.generateQuestionHash = generateQuestionHash;

module.exports = mongoose.model("Question", questionSchema);
