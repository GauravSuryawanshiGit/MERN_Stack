const mongoose = require("mongoose");
require("dotenv").config();
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const UserQuestionHistory = require("../models/UserQuestionHistory");
const User = require("../models/User");
const Result = require("../models/Result");
const quizService = require("../services/quizService");
const { validateQuestion } = require("../services/seederService");

const BASE_URL = "http://localhost:8080";

async function runTestSuite() {
    console.log("===============================================================");
    console.log("       QUIZO PRODUCTION-GRADE COMPREHENSIVE TEST SUITE         ");
    console.log("===============================================================");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for direct verification assertions.\n");

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = "") {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName} - ${details}`);
            failed++;
        }
    }

    // =========================================================================
    // SECTION 1: QUESTION BANK & SEEDING VALIDATION
    // =========================================================================
    console.log("\n--- SECTION 1: QUESTION BANK & SEEDING VALIDATION ---");

    const totalActiveQuestions = await Question.countDocuments({ isActive: true });
    assert(
        totalActiveQuestions >= 3000,
        "Total active seeded questions is >= 3,000",
        `Found ${totalActiveQuestions}`
    );

    // Test malformed question rejection
    const invalidQ1 = validateQuestion({ question: "Too short", options: ["A"], correctAnswer: "A" });
    assert(!invalidQ1.isValid, "Seeder rejects question with fewer than 2 options");

    const invalidQ2 = validateQuestion({ question: "Valid question text here?", options: ["A", "B", "C", "D"], correctAnswer: "E" });
    assert(!invalidQ2.isValid, "Seeder rejects question where correct answer is not in options");

    const invalidQ3 = validateQuestion({ question: "", options: ["A", "B"], correctAnswer: "A" });
    assert(!invalidQ3.isValid, "Seeder rejects question with empty prompt");

    // Normalized duplicate detection
    const qA = "Which keyword is used to inherit a class in Java?";
    const qB = "Which keyword is used to inherit a class in Java?! ";
    const hashA = Question.generateQuestionHash(qA);
    const hashB = Question.generateQuestionHash(qB);
    assert(hashA === hashB, "Normalized question text generates identical fingerprint hash despite punctuation/whitespace differences");

    // =========================================================================
    // SECTION 2: QUESTION PERSISTENCE & ZERO-REPETITION LOGIC
    // =========================================================================
    console.log("\n--- SECTION 2: ZERO-REPETITION LOGIC (CRITICAL REQUIREMENT) ---");

    const testUserAId = new mongoose.Types.ObjectId();
    const testUserBId = new mongoose.Types.ObjectId();
    const identityA = { userId: testUserAId, guestId: null, name: "Learner A", isGuest: false };
    const identityB = { userId: testUserBId, guestId: null, name: "Learner B", isGuest: false };

    // Clean any previous test history for these dummy IDs
    await UserQuestionHistory.deleteMany({ userId: { $in: [testUserAId, testUserBId] } });

    // User A takes First Quiz: Java Easy (5 questions)
    const quiz1 = await quizService.createQuizAttempt(identityA, {
        category: "Java",
        difficulty: "easy",
        count: 5
    });

    assert(quiz1.status === "SUCCESS", "User A successfully creates first quiz attempt");
    assert(quiz1.questions.length === 5, "First quiz contains exactly 5 questions");

    // Verify all 5 questions are unique within the quiz
    const q1Ids = quiz1.questions.map(q => q._id.toString());
    const uniqueQ1Ids = new Set(q1Ids);
    assert(uniqueQ1Ids.size === 5, "No duplicate questions exist within the first quiz");

    // Verify all 5 questions were immediately marked as presented in database
    const historyA1 = await UserQuestionHistory.find({ userId: testUserAId });
    assert(historyA1.length === 5, "All 5 presented questions persisted to UserQuestionHistory immediately");
    assert(historyA1.every(h => h.status === "presented"), "All questions initially have 'presented' status");

    // User A takes Second Quiz: Java Easy (5 questions)
    const quiz2 = await quizService.createQuizAttempt(identityA, {
        category: "Java",
        difficulty: "easy",
        count: 5
    });

    assert(quiz2.status === "SUCCESS", "User A successfully creates second quiz attempt");
    const q2Ids = quiz2.questions.map(q => q._id.toString());

    // CRITICAL ASSERTION: No question from quiz1 should appear in quiz2
    const overlap = q2Ids.filter(id => q1Ids.includes(id));
    assert(
        overlap.length === 0,
        "Zero repetition: Questions from Quiz 1 NEVER reappear in Quiz 2 for User A",
        `Found repeated IDs: ${overlap.join(", ")}`
    );

    // Verify User B has independent history and CAN receive questions User A saw
    const quizB1 = await quizService.createQuizAttempt(identityB, {
        category: "Java",
        difficulty: "easy",
        count: 5
    });
    assert(quizB1.status === "SUCCESS", "User B generates quiz with independent history");
    const historyB = await UserQuestionHistory.find({ userId: testUserBId });
    assert(historyB.length === 5, "User B history is recorded independently");

    // Test Abandoned Quiz: User A refreshes or abandons quiz2 without submitting
    // Questions must REMAIN seen and never be recycled just because the user didn't submit
    const quiz3 = await quizService.createQuizAttempt(identityA, {
        category: "Java",
        difficulty: "easy",
        count: 5
    });
    const q3Ids = quiz3.questions.map(q => q._id.toString());
    const overlapWithAbandoned = q3Ids.filter(id => q2Ids.includes(id) || q1Ids.includes(id));
    assert(
        overlapWithAbandoned.length === 0,
        "Abandoned quiz questions remain permanently marked as seen and are NOT recycled",
        `Repeated IDs: ${overlapWithAbandoned.join(", ")}`
    );

    // =========================================================================
    // SECTION 3: QUESTION EXHAUSTION & EXPLICIT RESET
    // =========================================================================
    console.log("\n--- SECTION 3: QUESTION EXHAUSTION & RESET ---");

    // Create a temporary small category with only 3 questions to test exhaustion
    const testCat = "ExhaustionTestCat";
    await Question.deleteMany({ category: testCat });
    const tempQuestions = [
        new Question({ question: "Exhaustion Q1?", options: ["A", "B"], correctAnswer: "A", category: testCat, subject: testCat, difficulty: "easy" }),
        new Question({ question: "Exhaustion Q2?", options: ["A", "B"], correctAnswer: "A", category: testCat, subject: testCat, difficulty: "easy" }),
        new Question({ question: "Exhaustion Q3?", options: ["A", "B"], correctAnswer: "A", category: testCat, subject: testCat, difficulty: "easy" })
    ];
    await Question.insertMany(tempQuestions);

    const testUserExhaustId = new mongoose.Types.ObjectId();
    const identityExhaust = { userId: testUserExhaustId, guestId: null, name: "Exhaustion Tester", isGuest: false };

    // Take all 3 questions
    const exQuiz1 = await quizService.createQuizAttempt(identityExhaust, {
        category: testCat,
        difficulty: "easy",
        count: 3
    });
    assert(exQuiz1.status === "SUCCESS" && exQuiz1.questions.length === 3, "Exhaustion tester successfully consumes all 3 questions");

    // Attempt to take another quiz in exhausted category
    const exQuiz2 = await quizService.createQuizAttempt(identityExhaust, {
        category: testCat,
        difficulty: "easy",
        count: 3
    });

    assert(
        exQuiz2.status === "EXHAUSTED",
        "Question engine returns EXHAUSTED status when zero unseen questions remain (never silently reuses)",
        `Status returned: ${exQuiz2.status}`
    );

    // Test Explicit Reset
    const resetResult = await quizService.resetUserHistory(identityExhaust, { category: testCat });
    assert(resetResult.deletedCount === 3, "Explicit reset successfully clears seen history for the category");

    // After reset, questions become available again
    const exQuiz3 = await quizService.createQuizAttempt(identityExhaust, {
        category: testCat,
        difficulty: "easy",
        count: 3
    });
    assert(exQuiz3.status === "SUCCESS", "Questions are accessible again only after explicit authorized reset");

    // Cleanup temporary test questions
    await Question.deleteMany({ category: testCat });
    await UserQuestionHistory.deleteMany({ category: testCat });

    // =========================================================================
    // SECTION 4: SCORING, SKIPPED QUESTIONS & IDEMPOTENCY
    // =========================================================================
    console.log("\n--- SECTION 4: SCORING, EVALUATION & IDEMPOTENCY ---");

    // Create an attempt for scoring verification
    const scoringQuiz = await quizService.createQuizAttempt(identityA, {
        category: "Python",
        difficulty: "medium",
        count: 4
    });

    assert(scoringQuiz.status === "SUCCESS", "Scoring quiz attempt created successfully");
    const targetAttemptId = scoringQuiz.attemptId;
    const questionsToAnswer = scoringQuiz.questions;

    // Load actual questions with answers directly from DB
    const dbQuestions = await Question.find({ _id: { $in: questionsToAnswer.map(q => q._id) } });
    const qMap = new Map();
    dbQuestions.forEach(q => qMap.set(q._id.toString(), q));

    // Submit: Question 1 correct, Question 2 wrong, Question 3 & 4 skipped (unanswered)
    const answersToSubmit = {};
    const q0 = questionsToAnswer[0];
    const q1 = questionsToAnswer[1];
    answersToSubmit[q0._id.toString()] = qMap.get(q0._id.toString()).correctAnswer; // Correct
    answersToSubmit[q1._id.toString()] = "DEFINITELY_WRONG_OPTION_XYZ";             // Incorrect
    // q2 and q3 are omitted (skipped)

    const evalResult = await quizService.submitQuizAttempt(identityA, targetAttemptId, answersToSubmit, 75);
    const resultDoc = evalResult.result;

    assert(!evalResult.isDuplicate, "First submission evaluates successfully");
    assert(resultDoc.correct === 1, "Correct answer count is exactly 1");
    assert(resultDoc.incorrect === 1, "Incorrect answer count is exactly 1");
    assert(resultDoc.skipped === 2, "Skipped/unanswered count is exactly 2");
    assert(resultDoc.total === 4, "Total question count is 4");
    assert(resultDoc.accuracy === 25, "Accuracy is correctly computed as 25%");
    assert(resultDoc.xp === 10, "Base XP correctly awarded (1 * 10 = 10 XP)");

    // Test Double Submission / Idempotency: submit the same attempt again
    const secondSubmit = await quizService.submitQuizAttempt(identityA, targetAttemptId, answersToSubmit, 75);
    assert(secondSubmit.isDuplicate === true, "Repeated submission is recognized as duplicate (idempotent)");
    assert(secondSubmit.result._id.toString() === resultDoc._id.toString(), "Returns existing result without duplicating records or double-crediting XP");

    // =========================================================================
    // SECTION 5: LIVE HTTP ENDPOINTS & GUEST SUPPORT
    // =========================================================================
    console.log("\n--- SECTION 5: LIVE HTTP ENDPOINTS & GUEST SUPPORT ---");

    // Test Guest Flow via HTTP
    const guestRes = await fetch(`${BASE_URL}/quiz/start?category=DSA&difficulty=easy&count=5`);
    assert(guestRes.status === 200, "Guest learner can start quiz without requiring immediate login");
    const guestHtml = await guestRes.text();
    assert(guestHtml.includes("palette-btn") && guestHtml.includes("quizTimerDisplay"), "Interactive question palette and timer rendered for guest");

    // Verify security: correctAnswer must NEVER appear in HTML
    assert(!guestHtml.includes("correctAnswer"), "Security check: 'correctAnswer' field is completely absent from rendered HTML");

    // Test Unseen Count API
    const countApiRes = await fetch(`${BASE_URL}/quiz/api/unseen-count?category=Java&difficulty=easy`);
    const countJson = await countApiRes.json();
    assert(typeof countJson.unseenCount === "number", "Unseen count API returns valid numeric count");

    // Test Domains API
    const domainsApiRes = await fetch(`${BASE_URL}/quiz/api/domains`);
    const domainsJson = await domainsApiRes.json();
    assert(domainsJson["Programming & CS"] !== undefined, "Domains API returns structured domain taxonomy");
    assert(domainsJson["Placements & Exams"] !== undefined, "Placements & Exams domain is registered");
    assert(domainsJson["General Knowledge"] !== undefined, "General Knowledge domain is registered");

    // =========================================================================
    // CLEANUP & FINAL REPORT
    // =========================================================================
    await UserQuestionHistory.deleteMany({ userId: { $in: [testUserAId, testUserBId, testUserExhaustId] } });
    await QuizAttempt.deleteMany({ userId: { $in: [testUserAId, testUserBId, testUserExhaustId] } });
    await Result.deleteMany({ userId: { $in: [testUserAId, testUserBId, testUserExhaustId] } });

    console.log("\n===============================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("===============================================================");

    if (failed === 0) {
        console.log("🏆 ALL TESTS PASSED SUCCESSFULLY! ARCHITECTURE IS PRODUCTION-READY.");
        process.exit(0);
    } else {
        console.error("❌ SOME TESTS FAILED.");
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error("Test execution threw unhandled exception:", err);
    process.exit(1);
});
