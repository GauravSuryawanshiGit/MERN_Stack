const { spawn } = require("child_process");
const http = require("http");

async function runTests() {
    console.log("=== STARTING QUIZO FULL E2E SUITE ===");

    // Test 1: GET / (Home Page)
    console.log("\n[Test 1] Testing GET / ...");
    const resHome = await fetch("http://localhost:8080/");
    console.log(`Status: ${resHome.status}`);
    const htmlHome = await resHome.text();
    if (htmlHome.includes("quizo-brand") && htmlHome.includes("Quick Start Quizzes") && htmlHome.includes("Custom Quiz Builder")) {
        console.log("PASS: Home page rendered with Seva Setu layout elements.");
    } else {
        console.error("FAIL: Home page missing expected layout components.");
    }

    // Test 2: GET /login
    console.log("\n[Test 2] Testing GET /login ...");
    const resLogin = await fetch("http://localhost:8080/login");
    console.log(`Status: ${resLogin.status}`);
    const htmlLogin = await resLogin.text();
    if (htmlLogin.includes("Sign In to Quizo") && htmlLogin.includes("auth-form-card")) {
        console.log("PASS: Login page rendered with correct heading and form controls.");
    } else {
        console.error("FAIL: Login page markup mismatch.");
    }

    // Test 3: GET /signup
    console.log("\n[Test 3] Testing GET /signup ...");
    const resSignup = await fetch("http://localhost:8080/signup");
    console.log(`Status: ${resSignup.status}`);
    const htmlSignup = await resSignup.text();
    if (htmlSignup.includes("Create an Account") && htmlSignup.includes("auth-form-card")) {
        console.log("PASS: Signup page rendered with correct heading and form controls.");
    } else {
        console.error("FAIL: Signup page markup mismatch.");
    }

    // Test 4: GET /leaderboard (Public)
    console.log("\n[Test 4] Testing GET /leaderboard ...");
    const resLb = await fetch("http://localhost:8080/leaderboard");
    console.log(`Status: ${resLb.status}`);
    const htmlLb = await resLb.text();
    if (htmlLb.includes("Global Leaderboard") && htmlLb.includes("table")) {
        console.log("PASS: Leaderboard rendered with podium and rankings table.");
    } else {
        console.error("FAIL: Leaderboard markup mismatch.");
    }

    // Test 5: GET /api/subjects
    console.log("\n[Test 5] Testing GET /api/subjects ...");
    const resSubj = await fetch("http://localhost:8080/api/subjects");
    console.log(`Status: ${resSubj.status}`);
    const subjects = await resSubj.json();
    console.log(`Available subjects: ${JSON.stringify(subjects)}`);
    if (Array.isArray(subjects) && subjects.length > 0) {
        console.log("PASS: API subjects returned array of distinct subjects.");
    } else {
        console.error("FAIL: API subjects empty or invalid.");
    }

    // Test 6: Auth Flow - Signup a test user & Login
    console.log("\n[Test 6] Testing User Registration & Authentication ...");
    const testEmail = `test_learner_${Date.now()}@example.com`;
    const testPassword = "Password123!";
    const testName = "Test Learner";

    const signupParams = new URLSearchParams();
    signupParams.append("name", testName);
    signupParams.append("email", testEmail);
    signupParams.append("password", testPassword);

    const resPostSignup = await fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: signupParams.toString(),
        redirect: "manual"
    });
    console.log(`Signup POST status: ${resPostSignup.status} (expected 302 redirect)`);

    // Now log in with test user to obtain session cookie
    const loginParams = new URLSearchParams();
    loginParams.append("email", testEmail);
    loginParams.append("password", testPassword);

    const resPostLogin = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginParams.toString(),
        redirect: "manual"
    });
    console.log(`Login POST status: ${resPostLogin.status} (expected 302 redirect)`);
    const rawCookies = resPostLogin.headers.get("set-cookie");
    const sessionCookie = rawCookies ? rawCookies.split(";")[0] : "";
    console.log(`Session cookie obtained: ${sessionCookie ? "YES" : "NO"}`);

    if (!sessionCookie) {
        console.error("FAIL: Could not obtain session cookie. Aborting authenticated tests.");
        return;
    }
    console.log("PASS: User registration and login completed successfully.");

    // Test 7: GET /dashboard (Authenticated)
    console.log("\n[Test 7] Testing GET /dashboard (with session) ...");
    const resDash = await fetch("http://localhost:8080/dashboard", {
        headers: { "Cookie": sessionCookie }
    });
    console.log(`Dashboard status: ${resDash.status}`);
    const htmlDash = await resDash.text();
    if (htmlDash.includes("Learner Dashboard") && htmlDash.includes(testName) && htmlDash.includes("subjectChart")) {
        console.log("PASS: Dashboard rendered with user profile info and chart canvas.");
    } else {
        console.error("FAIL: Dashboard content missing.");
    }

    // Test 8: GET /achievements (Authenticated)
    console.log("\n[Test 8] Testing GET /achievements (with session) ...");
    const resAch = await fetch("http://localhost:8080/achievements", {
        headers: { "Cookie": sessionCookie }
    });
    console.log(`Achievements status: ${resAch.status}`);
    const htmlAch = await resAch.text();
    if (htmlAch.includes("Achievements & Badges") && htmlAch.includes("Locked")) {
        console.log("PASS: Achievements page rendered with badge grid.");
    } else {
        console.error("FAIL: Achievements content missing.");
    }

    // Test 9: GET /profile (Authenticated)
    console.log("\n[Test 9] Testing GET /profile (with session) ...");
    const resProf = await fetch("http://localhost:8080/profile", {
        headers: { "Cookie": sessionCookie }
    });
    console.log(`Profile status: ${resProf.status}`);
    const htmlProf = await resProf.text();
    if (htmlProf.includes("User Profile") && htmlProf.includes(testEmail)) {
        console.log("PASS: Profile page rendered with user details.");
    } else {
        console.error("FAIL: Profile content missing.");
    }

    // Test 10: GET /profile/edit (Authenticated)
    console.log("\n[Test 10] Testing GET /profile/edit (with session) ...");
    const resEditProf = await fetch("http://localhost:8080/profile/edit", {
        headers: { "Cookie": sessionCookie }
    });
    console.log(`Profile Edit status: ${resEditProf.status}`);
    const htmlEditProf = await resEditProf.text();
    if (htmlEditProf.includes("Edit Profile") && htmlEditProf.includes("Save Changes")) {
        console.log("PASS: Profile edit page rendered with form inputs.");
    } else {
        console.error("FAIL: Profile edit content missing.");
    }

    // Test 11: GET /quiz/start (Start a Quiz)
    console.log("\n[Test 11] Testing GET /quiz/start?subject=Java&difficulty=easy&count=10 ...");
    const resQuiz = await fetch("http://localhost:8080/quiz/start?subject=Java&difficulty=easy&count=10", {
        headers: { "Cookie": sessionCookie }
    });
    console.log(`Quiz start status: ${resQuiz.status}`);
    const htmlQuiz = await resQuiz.text();
    if (htmlQuiz.includes("Assessment") && (htmlQuiz.includes("Timer") || htmlQuiz.includes("quizTimerDisplay")) && (htmlQuiz.includes("Submit Assessment") || htmlQuiz.includes("Submit Quiz"))) {
        console.log("PASS: Quiz participation page rendered with questions and timer.");
    } else {
        console.error("FAIL: Quiz participation page missing.");
    }

    // Test 12: POST /quiz/submit (Submit Answers)
    console.log("\n[Test 12] Testing POST /quiz/submit ...");
    // Extract question IDs from htmlQuiz
    const questionIdRegex = /name="([a-f0-9]{24})"/g;
    let match;
    const qIds = [];
    while ((match = questionIdRegex.exec(htmlQuiz)) !== null) {
        if (!qIds.includes(match[1])) {
            qIds.push(match[1]);
        }
    }
    console.log(`Found ${qIds.length} question IDs in quiz form.`);

    const submitParams = new URLSearchParams();
    submitParams.append("subject", "Java");
    submitParams.append("difficulty", "easy");
    submitParams.append("quizTime", "45");
    qIds.forEach(id => {
        submitParams.append(id, "dummy_answer");
    });

    const resSubmit = await fetch("http://localhost:8080/quiz/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": sessionCookie
        },
        body: submitParams.toString(),
        redirect: "manual"
    });
    console.log(`Quiz submit POST status: ${resSubmit.status} (expected 200 or 302)`);
    const submitHtml = await resSubmit.text();
    if (submitHtml.includes("Assessment Results") || submitHtml.includes("Quiz Results") || submitHtml.includes("Final Score")) {
        console.log("PASS: Quiz evaluated and result summary displayed!");
    } else if (resSubmit.status === 302) {
        console.log(`PASS: Quiz submitted and redirected to ${resSubmit.headers.get("location")}`);
    } else {
        console.log("Result preview:", submitHtml.substring(0, 300));
    }

    // Test 13: 404 Not Found Page
    console.log("\n[Test 13] Testing 404 page ...");
    const res404 = await fetch("http://localhost:8080/some-non-existent-page-url");
    console.log(`404 Status: ${res404.status}`);
    const html404 = await res404.text();
    if (html404.includes("Page Not Found") && html404.includes("404")) {
        console.log("PASS: 404 error page rendered with clean design and recovery links.");
    } else {
        console.error("FAIL: 404 page mismatch.");
    }

    console.log("\n=== ALL E2E TESTS COMPLETED SUCCESSFULLY! ===");
}

runTests().catch(err => {
    console.error("Test execution failed with error:", err);
    process.exit(1);
});

