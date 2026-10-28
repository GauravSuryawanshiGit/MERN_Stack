const crypto = require("crypto");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const UserQuestionHistory = require("../models/UserQuestionHistory");
const Result = require("../models/Result");
const User = require("../models/User");
const { QUIZ_DOMAINS, resolveCategory } = require("../config/quizDomains");

/**
 * Extracts or establishes a stable learner identity (Authenticated User or Guest).
 */
function getLearnerIdentity(req) {
    if (req.session && req.session.user && req.session.user._id) {
        return {
            userId: req.session.user._id,
            guestId: null,
            name: req.session.user.name,
            isGuest: false
        };
    }

    // Stable guest identity via session or cookie
    if (!req.session.guestId) {
        req.session.guestId = "guest_" + crypto.randomBytes(8).toString("hex");
    }

    return {
        userId: null,
        guestId: req.session.guestId,
        name: "Guest Learner",
        isGuest: true
    };
}

/**
 * Returns canonical question IDs previously presented to the user or guest.
 */
async function getPresentedQuestionIds(identity, scope = {}) {
    const filter = {};
    if (identity.userId) {
        filter.userId = identity.userId;
    } else if (identity.guestId) {
        filter.guestId = identity.guestId;
    } else {
        return [];
    }

    // Canonical ID tracking: by default, any question ID presented is excluded
    // across all sessions to prevent repetition.
    return await UserQuestionHistory.find(filter).distinct("questionId");
}

/**
 * Calculates remaining unseen question count for given filters.
 */
async function getUnseenQuestionCount(identity, filters = {}) {
    const seenIds = await getPresentedQuestionIds(identity, filters);

    const matchQuery = {
        isActive: true
    };

    if (seenIds.length > 0) {
        matchQuery._id = { $nin: seenIds };
    }

    if (filters.domain) {
        matchQuery.domain = filters.domain;
    }

    if (filters.category) {
        matchQuery.$or = [
            { category: filters.category },
            { subject: filters.category }
        ];
    }

    if (filters.difficulty && filters.difficulty.toLowerCase() !== "all") {
        matchQuery.difficulty = filters.difficulty.toLowerCase();
    }

    return await Question.countDocuments(matchQuery);
}

/**
 * Generates summary breakdown across all domains & categories with seen/unseen counts
 */
async function getDomainCategoryStats(identity) {
    const seenIds = await getPresentedQuestionIds(identity);
    const seenSet = new Set(seenIds.map(id => id.toString()));

    // Aggregate counts from Question collection
    const counts = await Question.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: { domain: "$domain", category: "$category", difficulty: "$difficulty" },
                total: { $sum: 1 },
                questionIds: { $push: "$_id" }
            }
        }
    ]);

    const result = {};

    for (const [domKey, domInfo] of Object.entries(QUIZ_DOMAINS)) {
        result[domKey] = {
            id: domInfo.id,
            name: domInfo.name,
            description: domInfo.description,
            categories: domInfo.categories.map(cat => {
                // Find matching aggregate rows
                const catRows = counts.filter(c =>
                    c._id.category && (c._id.category.toLowerCase() === cat.id.toLowerCase() ||
                    c._id.category.toLowerCase() === cat.name.toLowerCase())
                );

                let total = 0;
                let unseen = 0;

                for (const row of catRows) {
                    total += row.total;
                    for (const qid of row.questionIds) {
                        if (!seenSet.has(qid.toString())) {
                            unseen++;
                        }
                    }
                }

                return {
                    id: cat.id,
                    name: cat.name,
                    subcategories: cat.subcategories,
                    tags: cat.tags,
                    totalQuestions: total,
                    unseenQuestions: unseen,
                    seenQuestions: total - unseen
                };
            })
        };
    }

    return result;
}

/**
 * Creates a new quiz attempt, atomically selecting unseen questions and recording presentation history.
 */
async function createQuizAttempt(identity, config = {}) {
    const {
        domain = null,
        category = "Java",
        difficulty = "easy",
        count = 10,
        isDailyChallenge = false,
        allowShorter = false,
        durationMinutes = null
    } = config;

    const requestedCount = Math.max(1, parseInt(count, 10) || 10);
    const resolved = resolveCategory(category);
    const resolvedCategory = resolved ? resolved.category : category;
    const resolvedDomain = domain || (resolved ? resolved.domain : "Programming & CS");

    // Retrieve already presented question IDs for this user
    const seenIds = await getPresentedQuestionIds(identity);

    // Build matching query
    const matchQuery = {
        isActive: true,
        $or: [
            { category: resolvedCategory },
            { subject: resolvedCategory }
        ]
    };

    if (difficulty && difficulty.toLowerCase() !== "all") {
        matchQuery.difficulty = difficulty.toLowerCase();
    }

    if (seenIds.length > 0) {
        matchQuery._id = { $nin: seenIds };
    }

    // Check available unseen questions in DB
    const unseenAvailable = await Question.countDocuments(matchQuery);
    const totalInCat = await Question.countDocuments({
        isActive: true,
        $or: [{ category: resolvedCategory }, { subject: resolvedCategory }],
        ...(difficulty && difficulty.toLowerCase() !== "all" ? { difficulty: difficulty.toLowerCase() } : {})
    });

    // Case 1: Question Bank is completely exhausted for this user
    if (unseenAvailable === 0) {
        return {
            status: "EXHAUSTED",
            category: resolvedCategory,
            domain: resolvedDomain,
            difficulty,
            totalAnswered: totalInCat,
            unseenAvailable: 0,
            message: `You have completed all ${totalInCat} available questions for ${resolvedCategory} (${difficulty}). Reset your history to practice these questions again.`
        };
    }

    // Case 2: Insufficient unseen questions remaining for requested count
    let actualCount = requestedCount;
    if (unseenAvailable < requestedCount) {
        if (!allowShorter) {
            return {
                status: "INSUFFICIENT",
                category: resolvedCategory,
                domain: resolvedDomain,
                difficulty,
                unseenAvailable,
                requestedCount,
                message: `Only ${unseenAvailable} unseen question${unseenAvailable === 1 ? "" : "s"} remain in ${resolvedCategory} (${difficulty}). Would you like to start a shorter ${unseenAvailable}-question quiz or reset your history?`
            };
        }
        actualCount = unseenAvailable;
    }

    // Randomly sample unseen questions using aggregation
    const selected = await Question.aggregate([
        { $match: matchQuery },
        { $sample: { size: actualCount } }
    ]);

    if (!selected || selected.length === 0) {
        return {
            status: "EXHAUSTED",
            category: resolvedCategory,
            domain: resolvedDomain,
            difficulty,
            totalAnswered: totalInCat,
            unseenAvailable: 0
        };
    }

    // Calculate duration (1 minute per question default or custom)
    const durationSeconds = (durationMinutes ? parseInt(durationMinutes, 10) * 60 : actualCount * 60);

    // Atomically create the QuizAttempt
    const attempt = new QuizAttempt({
        userId: identity.userId || null,
        guestId: identity.guestId || null,
        domain: resolvedDomain,
        category: resolvedCategory,
        subject: resolvedCategory,
        difficulty: difficulty.toLowerCase(),
        questionCount: selected.length,
        durationSeconds,
        questions: selected.map(q => q._id),
        isDailyChallenge: Boolean(isDailyChallenge),
        status: "in_progress",
        startedAt: new Date()
    });

    await attempt.save();

    // Atomically record in UserQuestionHistory
    // Prevents race conditions with unique index on { userId, questionId }
    const historyOps = selected.map(q => {
        const filter = identity.userId
            ? { userId: identity.userId, questionId: q._id }
            : { guestId: identity.guestId, questionId: q._id };

        const insertDoc = {
            questionId: q._id,
            attemptId: attempt._id,
            domain: q.domain || resolvedDomain,
            category: q.category || resolvedCategory,
            status: "presented",
            presentedAt: new Date()
        };

        if (identity.userId) {
            insertDoc.userId = identity.userId;
        } else if (identity.guestId) {
            insertDoc.guestId = identity.guestId;
        }

        return {
            updateOne: {
                filter,
                update: {
                    $setOnInsert: insertDoc
                },
                upsert: true
            }
        };
    });

    try {
        await UserQuestionHistory.bulkWrite(historyOps, { ordered: false });
    } catch (err) {
        // Safe duplicate catch: if concurrent request won the race, it is logged
        console.warn("[quizService] Note on bulkWrite history insertion:", err.message);
    }

    // Security: Strip correctAnswer from frontend payload
    const sanitizedQuestions = selected.map((q, idx) => ({
        _id: q._id,
        index: idx + 1,
        question: q.question,
        options: shuffleArray([...q.options]), // randomized option display
        category: q.category || q.subject,
        subject: q.subject || q.category,
        difficulty: q.difficulty,
        domain: q.domain
    }));

    return {
        status: "SUCCESS",
        attemptId: attempt._id,
        attempt,
        questions: sanitizedQuestions,
        category: resolvedCategory,
        domain: resolvedDomain,
        difficulty,
        durationSeconds
    };
}

/**
 * Submits and evaluates a quiz attempt.
 * Protected against duplicate submissions and tamper attempts.
 */
async function submitQuizAttempt(identity, attemptId, submittedAnswers = {}, quizTimeSec = 0) {
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
        throw new Error("Invalid or missing attempt ID.");
    }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
        throw new Error("Quiz attempt not found.");
    }

    // Authorization check
    if (identity.userId && attempt.userId && attempt.userId.toString() !== identity.userId.toString()) {
        throw new Error("Unauthorized access to this quiz attempt.");
    }
    if (identity.guestId && attempt.guestId && attempt.guestId !== identity.guestId) {
        throw new Error("Unauthorized access to this quiz attempt.");
    }

    // IDEMPOTENCY CHECK: If already completed, return existing evaluation
    if (attempt.status === "completed" && attempt.resultId) {
        const existingResult = await Result.findById(attempt.resultId);
        if (existingResult) {
            return {
                isDuplicate: true,
                result: existingResult,
                attempt
            };
        }
    }

    // Load canonical question records with answer keys from database
    const questions = await Question.find({ _id: { $in: attempt.questions } });
    const questionMap = new Map();
    questions.forEach(q => questionMap.set(q._id.toString(), q));

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const answerDetails = {};

    for (const qId of attempt.questions) {
        const idStr = qId.toString();
        const q = questionMap.get(idStr);
        const userAns = (submittedAnswers[idStr] || "").trim();

        if (!q) continue;

        answerDetails[idStr] = userAns || "Not Answered";

        if (!userAns) {
            skippedCount++;
        } else if (userAns.toLowerCase() === q.correctAnswer.toLowerCase()) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    }

    const totalCount = attempt.questions.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const baseXP = correctCount * 10;
    let bonusXP = 0;

    // Handle Daily Challenge bonus
    if (attempt.isDailyChallenge && identity.userId) {
        const userDoc = await User.findById(identity.userId);
        if (userDoc) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let alreadyCompleted = false;
            if (userDoc.lastChallengeCompleted) {
                const last = new Date(userDoc.lastChallengeCompleted);
                last.setHours(0, 0, 0, 0);
                alreadyCompleted = (last.getTime() === today.getTime());
            }

            if (!alreadyCompleted) {
                bonusXP = 100;
                await User.findByIdAndUpdate(identity.userId, {
                    $set: { lastChallengeCompleted: new Date() }
                });
            }
        }
    }

    const totalXP = baseXP + bonusXP;
    const finalDuration = parseInt(quizTimeSec, 10) || attempt.durationSeconds;

    // Create Result document
    const resultDoc = await Result.create({
        userId: identity.userId || null,
        guestId: identity.guestId || null,
        attemptId: attempt._id,
        username: identity.name || "Learner",
        domain: attempt.domain,
        category: attempt.category,
        subject: attempt.subject || attempt.category,
        difficulty: attempt.difficulty,
        correct: correctCount,
        total: totalCount,
        incorrect: incorrectCount,
        skipped: skippedCount,
        accuracy,
        xp: totalXP,
        quizTime: finalDuration,
        timeTaken: finalDuration,
        answers: answerDetails
    });

    // Mark attempt completed
    attempt.status = "completed";
    attempt.score = correctCount;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.skippedCount = skippedCount;
    attempt.accuracy = accuracy;
    attempt.xpAwarded = totalXP;
    attempt.quizTime = finalDuration;
    attempt.submittedAt = new Date();
    attempt.resultId = resultDoc._id;
    attempt.answers = new Map(Object.entries(answerDetails));
    await attempt.save();

    // Update UserQuestionHistory status for presented questions
    const historyUpdateOps = attempt.questions.map(qId => {
        const idStr = qId.toString();
        const userAns = (submittedAnswers[idStr] || "").trim();
        const q = questionMap.get(idStr);
        const isCorr = q && userAns ? (userAns.toLowerCase() === q.correctAnswer.toLowerCase()) : false;

        const filter = identity.userId
            ? { userId: identity.userId, questionId: qId }
            : { guestId: identity.guestId, questionId: qId };

        return {
            updateOne: {
                filter,
                update: {
                    $set: {
                        status: userAns ? "answered" : "skipped",
                        selectedAnswer: userAns || null,
                        isCorrect: isCorr,
                        answeredAt: new Date()
                    }
                }
            }
        };
    });

    try {
        await UserQuestionHistory.bulkWrite(historyUpdateOps, { ordered: false });
    } catch (err) {
        console.warn("[quizService] UserQuestionHistory bulk update note:", err.message);
    }

    // Update User XP & Streak if authenticated
    if (identity.userId) {
        const user = await User.findById(identity.userId);
        if (user) {
            let newStreak = 1;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (user.lastQuizDate) {
                const lastDate = new Date(user.lastQuizDate);
                lastDate.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                    newStreak = user.streak;
                } else if (diffDays === 1) {
                    newStreak = user.streak + 1;
                } else {
                    newStreak = 1;
                }
            }

            await User.findByIdAndUpdate(identity.userId, {
                $inc: {
                    xp: totalXP,
                    totalQuizzes: 1,
                    totalCorrect: correctCount,
                    totalQuestions: totalCount
                },
                $set: {
                    streak: newStreak,
                    lastQuizDate: new Date()
                }
            });
        }
    }

    return {
        isDuplicate: false,
        result: resultDoc,
        attempt
    };
}

/**
 * Explicit user-authorized reset of question history.
 * Never occurs automatically.
 */
async function resetUserHistory(identity, filter = {}) {
    const query = {};
    if (identity.userId) {
        query.userId = identity.userId;
    } else if (identity.guestId) {
        query.guestId = identity.guestId;
    } else {
        return { deletedCount: 0 };
    }

    if (filter.category) {
        query.category = filter.category;
    }
    if (filter.domain) {
        query.domain = filter.domain;
    }

    const res = await UserQuestionHistory.deleteMany(query);
    return {
        deletedCount: res.deletedCount || 0,
        scope: filter.category || filter.domain || "All Categories"
    };
}

/**
 * Array shuffling utility (Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    getLearnerIdentity,
    getPresentedQuestionIds,
    getUnseenQuestionCount,
    getDomainCategoryStats,
    createQuizAttempt,
    submitQuizAttempt,
    resetUserHistory
};
