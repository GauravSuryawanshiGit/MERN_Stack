const express = require("express");
const router = express.Router();
const quizService = require("../services/quizService");
const Result = require("../models/Result");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");

/**
 * GET /quiz/start
 * Generates or resumes a quiz attempt with guaranteed question uniqueness.
 */
router.get("/start", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const { subject, category, difficulty = "easy", count = 10, allowShorter = false, isDailyChallenge = false } = req.query;

        const targetCat = (category || subject || "Java").trim();

        const quizResult = await quizService.createQuizAttempt(identity, {
            category: targetCat,
            difficulty: difficulty.toLowerCase(),
            count: parseInt(count, 10) || 10,
            allowShorter: allowShorter === "true" || allowShorter === true,
            isDailyChallenge: isDailyChallenge === "true" || isDailyChallenge === true
        });

        if (quizResult.status === "EXHAUSTED") {
            return res.render("quiz/exhausted", {
                category: quizResult.category,
                domain: quizResult.domain,
                difficulty: quizResult.difficulty,
                totalAnswered: quizResult.totalAnswered,
                message: quizResult.message
            });
        }

        if (quizResult.status === "INSUFFICIENT") {
            return res.render("quiz/insufficient", {
                category: quizResult.category,
                domain: quizResult.domain,
                difficulty: quizResult.difficulty,
                unseenAvailable: quizResult.unseenAvailable,
                requestedCount: quizResult.requestedCount,
                message: quizResult.message
            });
        }

        // Render the active quiz
        res.render("quiz/quiz", {
            attemptId: quizResult.attemptId,
            questions: quizResult.questions,
            subject: quizResult.category,
            category: quizResult.category,
            difficulty: quizResult.difficulty,
            durationSeconds: quizResult.durationSeconds,
            isDailyChallenge: Boolean(isDailyChallenge)
        });
    } catch (err) {
        console.error("[quizRoutes] Error starting quiz:", err);
        req.flash("error", "An error occurred while generating your quiz. Please try again.");
        res.redirect("/");
    }
});

/**
 * POST /quiz/submit
 * Evaluates submitted answers on the backend, updates progress, and renders results.
 */
router.post("/submit", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const { attemptId, quizTime = 0 } = req.body;

        // Collect answers from request body
        const submittedAnswers = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (
                key !== "attemptId" &&
                key !== "subject" &&
                key !== "category" &&
                key !== "difficulty" &&
                key !== "quizTime" &&
                key !== "isDailyChallenge"
            ) {
                submittedAnswers[key] = String(value).trim();
            }
        }

        let targetAttemptId = attemptId;

        // Fallback for legacy requests without explicit attemptId: lookup latest in-progress attempt
        if (!targetAttemptId) {
            const latestAttempt = await QuizAttempt.findOne({
                ...(identity.userId ? { userId: identity.userId } : { guestId: identity.guestId }),
                status: "in_progress"
            }).sort({ createdAt: -1 });

            if (latestAttempt) {
                targetAttemptId = latestAttempt._id;
            }
        }

        if (!targetAttemptId) {
            req.flash("error", "No active quiz attempt found to submit.", "Submission Error", { mode: "modal" });
            return res.redirect("/");
        }

        const evaluation = await quizService.submitQuizAttempt(
            identity,
            targetAttemptId,
            submittedAnswers,
            quizTime
        );

        const resultDoc = evaluation.result;

        res.locals.alert = {
            type: "success",
            title: evaluation.isDuplicate ? "Quiz Already Evaluated" : "Quiz Submitted Successfully",
            message: `You scored ${resultDoc.correct} out of ${resultDoc.total} (${resultDoc.accuracy}% accuracy).`,
            mode: "modal",
            confirmButtonText: "View Results"
        };

        res.render("quiz/result", {
            resultId: resultDoc._id,
            correct: resultDoc.correct,
            total: resultDoc.total,
            incorrect: resultDoc.incorrect,
            skipped: resultDoc.skipped,
            accuracy: resultDoc.accuracy,
            xp: resultDoc.xp,
            quizTime: resultDoc.quizTime || resultDoc.timeTaken || 0,
            subject: resultDoc.subject || resultDoc.category,
            category: resultDoc.category
        });
    } catch (err) {
        console.error("[quizRoutes] Error evaluating quiz submission:", err);
        req.flash("error", "Failed to submit quiz. Please try again.");
        res.redirect("/");
    }
});

/**
 * GET /quiz/review/:id
 * Detailed question-by-question review of a completed quiz attempt.
 */
router.get("/review/:id", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const result = await Result.findById(req.params.id);

        if (!result) {
            req.flash("error", "Quiz result not found.");
            return res.redirect("/dashboard");
        }

        // Ownership check
        if (identity.userId && result.userId && result.userId.toString() !== identity.userId.toString()) {
            req.flash("error", "Unauthorized access to this result.");
            return res.redirect("/dashboard");
        }

        const questionIds = Object.keys(result.answers || {}).filter(k => k.length === 24);
        const questions = await Question.find({ _id: { $in: questionIds } });

        res.render("quiz/review", {
            result,
            questions
        });
    } catch (err) {
        console.error("[quizRoutes] Error loading quiz review:", err);
        res.redirect("/dashboard");
    }
});

/**
 * POST /quiz/reset-history
 * Explicit user action to reset seen question history for a category or domain.
 */
router.post("/reset-history", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const { category, domain } = req.body;

        const outcome = await quizService.resetUserHistory(identity, { category, domain });

        req.flash(
            "success",
            `Question history for ${outcome.scope} was successfully reset (${outcome.deletedCount} questions cleared). You can now practice these questions again.`,
            "History Reset",
            { mode: "modal", confirmButtonText: "Start Practice" }
        );

        if (category) {
            return res.redirect(`/quiz/start?category=${encodeURIComponent(category)}&count=10`);
        }
        res.redirect("/");
    } catch (err) {
        console.error("[quizRoutes] Error resetting user history:", err);
        req.flash("error", "Could not reset question history.");
        res.redirect("/");
    }
});

/**
 * GET /quiz/api/unseen-count
 * Live JSON API for Custom Quiz Builder
 */
router.get("/api/unseen-count", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const { domain, category, difficulty } = req.query;

        const count = await quizService.getUnseenQuestionCount(identity, {
            domain,
            category,
            difficulty
        });

        res.json({ unseenCount: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /quiz/api/domains
 * Returns full domain taxonomy and availability breakdown
 */
router.get("/api/domains", async (req, res) => {
    try {
        const identity = quizService.getLearnerIdentity(req);
        const breakdown = await quizService.getDomainCategoryStats(identity);
        res.json(breakdown);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
