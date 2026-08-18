const Result = require("../models/Result");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {


    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {

        const user = await User.findById(
            req.session.user._id
        );

        const attempts = await Result.find({
            userId: req.session.user._id
        }).sort({ createdAt: -1 });

        let bestTime = null;

        attempts.forEach(a => {

            if (
                a.quizTime !== undefined &&
                a.quizTime !== null &&
                (bestTime === null || a.quizTime < bestTime)
            ) {
                bestTime = a.quizTime;
            }

        });

        const accuracy =
            user.totalQuestions > 0
                ? Math.round(
                    (user.totalCorrect / user.totalQuestions) * 100
                )
                : 0;

        let level = 1;

        if (user.xp >= 100) level = 2;
        if (user.xp >= 300) level = 3;
        if (user.xp >= 600) level = 4;
        if (user.xp >= 1000) level = 5;
        if (user.xp >= 1500) level = 6;
        if (user.xp >= 2500) level = 7;

        let currentLevelXP = 0;
        let nextLevelXP = 100;

        if (level === 1) {
            currentLevelXP = 0;
            nextLevelXP = 100;
        }
        else if (level === 2) {
            currentLevelXP = 100;
            nextLevelXP = 300;
        }
        else if (level === 3) {
            currentLevelXP = 300;
            nextLevelXP = 600;
        }
        else if (level === 4) {
            currentLevelXP = 600;
            nextLevelXP = 1000;
        }
        else {
            currentLevelXP = 1000;
            nextLevelXP = 1500;
        }

        let xpProgress = Math.min(
            100,
            user.xp % 100
        );

        const allUsers = await User.find()
            .sort({ xp: -1 });

        const rank =
            allUsers.findIndex(
                u => u._id.toString() === req.session.user._id
            ) + 1;

        const subjectStats = {};

        attempts.forEach(a => {

            if (!subjectStats[a.subject]) {
                subjectStats[a.subject] = {
                    totalAccuracy: 0,
                    count: 0
                };
            }

            subjectStats[a.subject].totalAccuracy += a.accuracy;
            subjectStats[a.subject].count++;

        });

        const chartLabels = [];
        const chartData = [];

        for (const subject in subjectStats) {

            chartLabels.push(subject);

            chartData.push(
                Math.round(
                    subjectStats[subject].totalAccuracy /
                    subjectStats[subject].count
                )
            );

        }

        const subjects = [
            "DSA",
            "DBMS",
            "OS",
            "CN",
            "Java",
            "Python",
            "AI AND ML",
            "Web Development",
            "Aptitude"
        ];

        const difficulties = [
            "easy",
            "medium",
            "hard"
        ];

        const dayNumber =
            Math.floor(
                Date.now() /
                (1000 * 60 * 60 * 24)
            );

        const dailyChallenge = {
            subject:
                subjects[
                dayNumber %
                subjects.length
                ],

            difficulty:
                difficulties[
                dayNumber % 3
                ],

            rewardXP: 100
        };

        res.render("dashboard/dashboard", {
            user,
            attempts,
            accuracy,
            level,
            rank,
            bestTime,
            xpProgress,
            chartLabels,
            chartData,
            dailyChallenge
        });

    } catch (err) {

        console.log(err);

        res.send("Dashboard Error");

    }


};

exports.getAISuggestions = async (req, res) => {


    if (!req.session.user) {
        return res.redirect("/login");
    }

    const results = await Result.find({
        userId: req.session.user._id
    });

    const weakTopics = [];

    const subjects = {};

    results.forEach(r => {

        if (!subjects[r.subject]) {
            subjects[r.subject] = [];
        }

        subjects[r.subject].push(r.accuracy);

    });

    for (let subject in subjects) {

        const avg =
            subjects[subject].reduce((a, b) => a + b, 0)
            / subjects[subject].length;

        if (avg < 60) {
            weakTopics.push(subject);
        }

    }

    res.json({
        weakTopics
    });


};
