const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");
const Result = require("../models/Result");
const UserQuestionHistory = require("../models/UserQuestionHistory");
const quizService = require("../services/quizService");

const BASE_URL = "http://localhost:8080";

async function runComprehensiveQATest() {
    console.log("================================================================================");
    console.log("             QUIZO PRODUCTION QA & END-TO-END TEST SUITE                      ");
    console.log("================================================================================");
    console.log(`Target URL: ${BASE_URL}`);
    console.log(`Timestamp:  ${new Date().toISOString()}\n`);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connection Active for Direct Assertions.\n");

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, testName, extra = "") {
        totalTests++;
        if (condition) {
            console.log(`  [PASS] ${testName}`);
            passedTests++;
        } else {
            console.error(`  [FAIL] ${testName} - ${extra}`);
            failedTests++;
        }
    }

    // =========================================================================
    // MODULE 1: PUBLIC INTERFACE & SEVA SETU STYLING
    // =========================================================================
    console.log("\n--- [MODULE 1] PUBLIC PAGES & SEVA SETU DESIGN COMPLIANCE ---");

    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, "GET / loads successfully (HTTP 200)");
    const homeHtml = await homeRes.text();
    assert(
        homeHtml.includes("quizo-topbar") && homeHtml.includes("quizo-panel"),
        "Home page contains Seva Setu full-width navbar (.quizo-topbar) and central white panel (.quizo-panel)"
    );
    assert(
        homeHtml.includes("Skill Assessment Platform"),
        "Home page displays the brand tagline 'Skill Assessment Platform'"
    );
    assert(
        homeHtml.includes("domainSelect") && homeHtml.includes("categorySelect"),
        "Home page contains cascading domain and category selectors"
    );

    // =========================================================================
    // MODULE 2: TAXONOMY & UNSEEN COUNT APIS
    // =========================================================================
    console.log("\n--- [MODULE 2] TAXONOMY & UNSEEN COUNT REST APIS ---");

    const domainsRes = await fetch(`${BASE_URL}/quiz/api/domains`);
    assert(domainsRes.status === 200, "GET /quiz/api/domains returns HTTP 200");
    const domainsData = await domainsRes.json();
    assert(
        domainsData["Programming & CS"] &&
        domainsData["Placements & Exams"] &&
        domainsData["General Knowledge"],
        "Domains API returns all 3 master domains with category metadata"
    );

    const unseenRes = await fetch(`${BASE_URL}/quiz/api/unseen-count?category=Java&difficulty=easy`);
    assert(unseenRes.status === 200, "GET /quiz/api/unseen-count returns HTTP 200");
    const unseenData = await unseenRes.json();
    assert(
        typeof unseenData.unseenCount === "number" && unseenData.unseenCount > 0,
        "Unseen count API returns positive integer for Java easy",
        `Received: ${unseenData.unseenCount}`
    );

    const subjectsRes = await fetch(`${BASE_URL}/api/subjects`);
    assert(subjectsRes.status === 200, "GET /api/subjects returns HTTP 200");
    const subjectsList = await subjectsRes.json();
    assert(Array.isArray(subjectsList) && subjectsList.length >= 25, "Subjects API returns complete list of categories");

    // =========================================================================
    // MODULE 3: AUTHENTICATION, ACCESS CONTROL & SESSION SECURITY
    // =========================================================================
    console.log("\n--- [MODULE 3] AUTHENTICATION, ACCESS CONTROL & SESSION SECURITY ---");

    // 1. Unauthenticated access to protected route
    const unauthDash = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    assert(
        unauthDash.status === 302 && (unauthDash.headers.get("location") || "").includes("/login"),
        "Unauthenticated GET /dashboard strictly redirects to /login"
    );

    const unauthProfile = await fetch(`${BASE_URL}/profile`, { redirect: "manual" });
    assert(
        unauthProfile.status === 302 && (unauthProfile.headers.get("location") || "").includes("/login"),
        "Unauthenticated GET /profile strictly redirects to /login"
    );

    // 2. User Registration
    const testEmail = `qa_engineer_${Date.now()}@quizo.portal`;
    const testPassword = "ProductionPassword#2026";
    const testName = "Senior QA Tester";

    const signupRes = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name: testName, email: testEmail, password: testPassword }),
        redirect: "manual"
    });
    assert(
        signupRes.status === 302 && (signupRes.headers.get("location") || "").includes("/login"),
        "Valid POST /signup creates account and redirects to /login"
    );

    // 3. Duplicate User Registration
    const dupSignupRes = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name: testName, email: testEmail, password: testPassword }),
        redirect: "manual"
    });
    assert(dupSignupRes.status === 409, "Duplicate POST /signup returns HTTP 409 Conflict");
    const dupHtml = await dupSignupRes.text();
    assert(dupHtml.includes(testEmail) && dupHtml.includes("Already Registered"), "User-exists notification correctly rendered");

    // 4. Invalid Password Login
    const badLoginRes = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: testEmail, password: "WRONG_PASSWORD_XYZ" }),
        redirect: "manual"
    });
    assert(
        badLoginRes.status === 302 && (badLoginRes.headers.get("location") || "").includes("/login"),
        "Invalid password login is rejected and redirected to /login"
    );

    // 5. Valid Login & Session Cookie Acquisition
    const goodLoginRes = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: testEmail, password: testPassword }),
        redirect: "manual"
    });
    assert(goodLoginRes.status === 302, "Valid login succeeds with HTTP 302 redirect");
    const rawCookie = goodLoginRes.headers.get("set-cookie") || "";
    let sessionCookie = rawCookie.split(";")[0];
    assert(sessionCookie.includes("connect.sid"), "Session cookie 'connect.sid' issued successfully");

    // 6. Access Protected Route with Session
    const authDashRes = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: sessionCookie }
    });
    assert(authDashRes.status === 200, "Authenticated user accesses GET /dashboard with HTTP 200");
    const dashHtml = await authDashRes.text();
    assert(
        dashHtml.includes(testName) && dashHtml.includes("subjectChart"),
        "Dashboard correctly renders learner name, statistics, and Chart.js canvas (subjectChart)"
    );

    // =========================================================================
    // MODULE 4: PROFILE MANAGEMENT & PROFILE EDIT
    // =========================================================================
    console.log("\n--- [MODULE 4] PROFILE MANAGEMENT & UPDATES ---");

    const profileRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: sessionCookie }
    });
    assert(profileRes.status === 200, "GET /profile renders successfully for authenticated user");

    const updatedBio = "Certified QA Automation and Security Specialist";
    const updatedName = "Senior QA Lead Engineer";
    
    const editRes = await fetch(`${BASE_URL}/profile/edit`, {
        method: "POST",
        headers: {
            Cookie: sessionCookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ name: updatedName, bio: updatedBio }),
        redirect: "manual"
    });
    assert(
        editRes.status === 302 && (editRes.headers.get("location") || "").includes("/profile"),
        "POST /profile/edit updates user profile and redirects to /profile"
    );

    if (editRes.headers.get("set-cookie")) {
        sessionCookie = editRes.headers.get("set-cookie").split(";")[0];
    }

    const verifiedProfileRes = await fetch(`${BASE_URL}/profile`, {
        headers: { Cookie: sessionCookie }
    });
    const verifiedProfileHtml = await verifiedProfileRes.text();
    assert(
        verifiedProfileHtml.includes(updatedName) && verifiedProfileHtml.includes(updatedBio),
        "Profile page reflects updated name and bio"
    );

    // =========================================================================
    // MODULE 5: GUEST LEARNER QUIZ JOURNEY & SECURITY AUDIT
    // =========================================================================
    console.log("\n--- [MODULE 5] GUEST LEARNER QUIZ JOURNEY & CLIENT SECURITY ---");

    // Start quiz as Guest
    const guestStartRes = await fetch(`${BASE_URL}/quiz/start?category=Java&difficulty=easy&count=5`);
    assert(guestStartRes.status === 200, "Guest starts quiz without requiring login");
    const guestCookieHeader = guestStartRes.headers.get("set-cookie") || "";
    const guestCookie = guestCookieHeader.split(";")[0];
    assert(guestCookie.includes("connect.sid"), "Guest session cookie 'connect.sid' generated");

    const guestQuizHtml = await guestStartRes.text();

    // CRITICAL SECURITY ASSERTION
    assert(
        !guestQuizHtml.includes("correctAnswer") && !guestQuizHtml.includes("explanation"),
        "SECURITY: Client HTML is completely stripped of 'correctAnswer' and 'explanation' fields"
    );

    // Check UI components
    assert(
        guestQuizHtml.includes("palette-btn") &&
        guestQuizHtml.includes("quizTimerDisplay") &&
        guestQuizHtml.includes("submitModalBtn"),
        "Quiz UI contains question navigation palette, countdown timer, and submit button"
    );

    // Extract attemptId & questions
    const attemptMatch = guestQuizHtml.match(/name="attemptId" value="([a-f0-9]{24})"/);
    assert(attemptMatch && attemptMatch[1], "Quiz HTML contains valid MongoDB attemptId");
    const guestAttemptId = attemptMatch ? attemptMatch[1] : null;

    const qRegex = /name="([a-f0-9]{24})"/g;
    const guestQIds = [];
    let qm;
    while ((qm = qRegex.exec(guestQuizHtml)) !== null) {
        if (!guestQIds.includes(qm[1])) guestQIds.push(qm[1]);
    }
    assert(guestQIds.length === 5, "Extracted exactly 5 question IDs from active quiz page");

    // Fetch question docs to know correct answers for scoring verification
    const canonicalQuestions = await Question.find({ _id: { $in: guestQIds } });
    const qMap = new Map();
    canonicalQuestions.forEach(q => qMap.set(q._id.toString(), q));

    // Submit: Q0 Correct, Q1 Wrong, Q2-Q4 Skipped
    const submitBody = new URLSearchParams();
    submitBody.append("attemptId", guestAttemptId);
    submitBody.append("quizTime", "45");
    submitBody.append(guestQIds[0], qMap.get(guestQIds[0]).correctAnswer);
    submitBody.append(guestQIds[1], "INVALID_DISTRACTOR_OPTION_CHOICE");
    // guestQIds[2], [3], [4] left unanswered (skipped)

    const guestSubmitRes = await fetch(`${BASE_URL}/quiz/submit`, {
        method: "POST",
        headers: {
            Cookie: guestCookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: submitBody
    });
    assert(guestSubmitRes.status === 200, "POST /quiz/submit evaluates and returns HTTP 200");
    const guestResultHtml = await guestSubmitRes.text();

    assert(
        guestResultHtml.includes("Performance Summary") &&
        guestResultHtml.includes("Accuracy") &&
        guestResultHtml.includes("Review Full Answers"),
        "Result page displays Performance Summary, accuracy metrics, and Review link"
    );

    // Extract Result ID
    const reviewMatch = guestResultHtml.match(/\/quiz\/review\/([a-f0-9]{24})/);
    assert(reviewMatch && reviewMatch[1], "Result page provides link to question review with valid Result ID");
    const resultId = reviewMatch ? reviewMatch[1] : null;

    // Direct Database Verification of the Result record
    const resultDoc = await Result.findById(resultId);
    assert(resultDoc !== null, "Result record persisted to MongoDB");
    assert(resultDoc.correct === 1, "Scored exactly 1 correct answer in database", `Got: ${resultDoc.correct}`);
    assert(resultDoc.incorrect === 1, "Scored exactly 1 incorrect answer in database", `Got: ${resultDoc.incorrect}`);
    assert(resultDoc.skipped === 3, "Scored exactly 3 skipped questions in database", `Got: ${resultDoc.skipped}`);
    assert(resultDoc.total === 5, "Total questions equals 5", `Got: ${resultDoc.total}`);
    assert(resultDoc.accuracy === 20, "Accuracy equals 20% (1/5)", `Got: ${resultDoc.accuracy}`);

    // Verify Review Page
    const reviewRes = await fetch(`${BASE_URL}/quiz/review/${resultId}`, {
        headers: { Cookie: guestCookie }
    });
    assert(reviewRes.status === 200, "GET /quiz/review/:id renders successfully");
    const reviewHtml = await reviewRes.text();
    assert(
        reviewHtml.includes("Review Quiz Answers") &&
        reviewHtml.includes("Correct Answer:") &&
        reviewHtml.includes("Explanation:"),
        "Review page displays detailed answer keys and explanations"
    );

    // Test Idempotency: Submit the identical attempt again
    const dupSubmitRes = await fetch(`${BASE_URL}/quiz/submit`, {
        method: "POST",
        headers: {
            Cookie: guestCookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: submitBody
    });
    assert(dupSubmitRes.status === 200, "Repeated submission of completed attempt returns HTTP 200 without crashing");
    const dupSubmitHtml = await dupSubmitRes.text();
    assert(
        dupSubmitHtml.includes("Quiz Already Evaluated") || dupSubmitHtml.includes("Performance Summary"),
        "Idempotency guard handles duplicate submission gracefully"
    );

    // =========================================================================
    // MODULE 6: AUTHENTICATED ZERO-REPETITION QUIZ ENGINE
    // =========================================================================
    console.log("\n--- [MODULE 6] AUTHENTICATED ZERO-REPETITION VERIFICATION ---");

    // Quiz 1 for Authenticated User: Java Easy (5 questions)
    const userQuiz1Res = await fetch(`${BASE_URL}/quiz/start?category=Java&difficulty=easy&count=5`, {
        headers: { Cookie: sessionCookie }
    });
    const userQuiz1Html = await userQuiz1Res.text();
    const qIdsQuiz1 = [];
    let m1;
    const regex1 = /name="([a-f0-9]{24})"/g;
    while ((m1 = regex1.exec(userQuiz1Html)) !== null) {
        if (!qIdsQuiz1.includes(m1[1])) qIdsQuiz1.push(m1[1]);
    }
    assert(qIdsQuiz1.length === 5, "Authenticated user received 5 questions in Quiz 1");

    // Quiz 2 for Authenticated User: Java Easy (5 questions)
    const userQuiz2Res = await fetch(`${BASE_URL}/quiz/start?category=Java&difficulty=easy&count=5`, {
        headers: { Cookie: sessionCookie }
    });
    const userQuiz2Html = await userQuiz2Res.text();
    const qIdsQuiz2 = [];
    let m2;
    const regex2 = /name="([a-f0-9]{24})"/g;
    while ((m2 = regex2.exec(userQuiz2Html)) !== null) {
        if (!qIdsQuiz2.includes(m2[1])) qIdsQuiz2.push(m2[1]);
    }
    assert(qIdsQuiz2.length === 5, "Authenticated user received 5 questions in Quiz 2");

    // CRITICAL ASSERTION: Zero Repetition across consecutive attempts
    const repeatIds = qIdsQuiz2.filter(id => qIdsQuiz1.includes(id));
    assert(
        repeatIds.length === 0,
        "ZERO-REPETITION: No questions from Quiz 1 reappear in Quiz 2 for this user",
        `Repeated IDs: ${repeatIds.join(", ")}`
    );

    // Abandoned Quiz Test: Start Quiz 3 and do not submit
    const userQuiz3Res = await fetch(`${BASE_URL}/quiz/start?category=Java&difficulty=easy&count=5`, {
        headers: { Cookie: sessionCookie }
    });
    const userQuiz3Html = await userQuiz3Res.text();
    const qIdsQuiz3 = [];
    let m3;
    const regex3 = /name="([a-f0-9]{24})"/g;
    while ((m3 = regex3.exec(userQuiz3Html)) !== null) {
        if (!qIdsQuiz3.includes(m3[1])) qIdsQuiz3.push(m3[1]);
    }

    // Now start Quiz 4: Abandoned questions in Quiz 3 must NOT be recycled
    const userQuiz4Res = await fetch(`${BASE_URL}/quiz/start?category=Java&difficulty=easy&count=5`, {
        headers: { Cookie: sessionCookie }
    });
    const userQuiz4Html = await userQuiz4Res.text();
    const qIdsQuiz4 = [];
    let m4;
    const regex4 = /name="([a-f0-9]{24})"/g;
    while ((m4 = regex4.exec(userQuiz4Html)) !== null) {
        if (!qIdsQuiz4.includes(m4[1])) qIdsQuiz4.push(m4[1]);
    }
    const overlapWithAbandoned = qIdsQuiz4.filter(id => qIdsQuiz3.includes(id));
    assert(
        overlapWithAbandoned.length === 0,
        "ABANDONED QUIZ RESILIENCE: Questions from unsubmitted/abandoned attempts remain permanently marked as seen",
        `Repeated Abandoned IDs: ${overlapWithAbandoned.join(", ")}`
    );

    // =========================================================================
    // MODULE 7: EXHAUSTION HANDLING & EXPLICIT RESET
    // =========================================================================
    console.log("\n--- [MODULE 7] QUESTION EXHAUSTION & EXPLICIT RESET ---");

    // Create temporary category with 2 questions
    const exhaustCat = `TempExhaust_${Date.now()}`;
    await Question.insertMany([
        { question: "Exhaustion Demo Question 1?", options: ["Yes", "No"], correctAnswer: "Yes", category: exhaustCat, subject: exhaustCat, difficulty: "easy" },
        { question: "Exhaustion Demo Question 2?", options: ["Yes", "No"], correctAnswer: "Yes", category: exhaustCat, subject: exhaustCat, difficulty: "easy" }
    ]);

    // User exhausts category
    const exStart1 = await fetch(`${BASE_URL}/quiz/start?category=${exhaustCat}&difficulty=easy&count=2`, {
        headers: { Cookie: sessionCookie }
    });
    assert(exStart1.status === 200, "User starts quiz consuming available category questions");

    // Next request to same exhausted category
    const exStart2 = await fetch(`${BASE_URL}/quiz/start?category=${exhaustCat}&difficulty=easy&count=2`, {
        headers: { Cookie: sessionCookie }
    });
    assert(exStart2.status === 200, "Exhausted category responds with HTTP 200");
    const exHtml2 = await exStart2.text();
    assert(
        exHtml2.includes("Question Bank Completed") && exHtml2.includes("Reset History"),
        "Engine renders dedicated 'Question Bank Completed' page with Reset button"
    );

    // Execute Explicit History Reset
    const resetRes = await fetch(`${BASE_URL}/quiz/reset-history`, {
        method: "POST",
        headers: {
            Cookie: sessionCookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ category: exhaustCat }),
        redirect: "manual"
    });
    assert(resetRes.status === 302, "POST /quiz/reset-history redirects after resetting");

    // After reset, questions are accessible again
    const exStart3 = await fetch(`${BASE_URL}/quiz/start?category=${exhaustCat}&difficulty=easy&count=2`, {
        headers: { Cookie: sessionCookie }
    });
    const exHtml3 = await exStart3.text();
    assert(
        exHtml3.includes("palette-btn"),
        "Questions become accessible again only after explicit user-authorized reset"
    );

    // Cleanup temp questions
    await Question.deleteMany({ category: exhaustCat });
    await UserQuestionHistory.deleteMany({ category: exhaustCat });

    // =========================================================================
    // MODULE 8: GAMIFICATION, LEADERBOARDS & ACHIEVEMENTS
    // =========================================================================
    console.log("\n--- [MODULE 8] GAMIFICATION, LEADERBOARDS & ACHIEVEMENTS ---");

    const lbRes = await fetch(`${BASE_URL}/leaderboard`);
    assert(lbRes.status === 200, "GET /leaderboard loads with HTTP 200");
    const lbHtml = await lbRes.text();
    assert(
        lbHtml.includes("Leaderboard") && lbHtml.includes("table"),
        "Leaderboard renders podium rankings and accuracy comparison table"
    );

    const achRes = await fetch(`${BASE_URL}/achievements`, {
        headers: { Cookie: sessionCookie }
    });
    assert(achRes.status === 200, "GET /achievements loads with HTTP 200");
    const achHtml = await achRes.text();
    assert(
        achHtml.includes("Achievements & Badges") && achHtml.includes("stat-box"),
        "Achievements page renders milestone badges with progress indicators"
    );

    // =========================================================================
    // MODULE 9: ERROR BOUNDARIES & RECOVERY
    // =========================================================================
    console.log("\n--- [MODULE 9] ERROR BOUNDARIES & RECOVERY ---");

    const notFoundRes = await fetch(`${BASE_URL}/route-that-does-not-exist-${Date.now()}`);
    assert(notFoundRes.status === 404, "Invalid URL returns HTTP 404 Not Found");
    const notFoundHtml = await notFoundRes.text();
    assert(
        notFoundHtml.includes("404") && notFoundHtml.includes("quizo-panel"),
        "404 page conforms to Seva Setu styling with navigation recovery options"
    );

    // POST /quiz/submit with bogus attempt ID
    const bogusSubmitRes = await fetch(`${BASE_URL}/quiz/submit`, {
        method: "POST",
        headers: {
            Cookie: sessionCookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ attemptId: "000000000000000000000000", quizTime: "10" }),
        redirect: "manual"
    });
    assert(
        bogusSubmitRes.status === 302,
        "POST /quiz/submit with invalid attemptId redirects cleanly without 500 crash"
    );

    // =========================================================================
    // CLEANUP QA USER DATA
    // =========================================================================
    const userDoc = await User.findOne({ email: testEmail });
    if (userDoc) {
        await UserQuestionHistory.deleteMany({ userId: userDoc._id });
        await QuizAttempt.deleteMany({ userId: userDoc._id });
        await Result.deleteMany({ userId: userDoc._id });
        await User.deleteOne({ _id: userDoc._id });
    }

    // =========================================================================
    // FINAL QA SUMMARY
    // =========================================================================
    console.log("\n================================================================================");
    console.log(`TOTAL QA ASSERTIONS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
    console.log("================================================================================");

    if (failedTests === 0) {
        console.log("🎉 ALL QA TESTS PASSED! THE APPLICATION IS CERTIFIED PRODUCTION-READY.");
        process.exit(0);
    } else {
        console.error("❌ QA SUITE FAILED. FIX ISSUES BEFORE PUSHING.");
        process.exit(1);
    }
}

runComprehensiveQATest().catch(err => {
    console.error("Fatal unhandled QA error:", err);
    process.exit(1);
});
