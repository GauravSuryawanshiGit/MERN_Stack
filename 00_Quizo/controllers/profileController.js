const User = require("../models/User");
const Result = require("../models/Result");

exports.getProfile = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/login");

        const user = await User.findById(req.session.user._id);
        if (!user) return res.redirect("/login");

        const userXP = Number(user.xp) || 0;
        const userTotalQuestions = Number(user.totalQuestions) || 0;
        const userTotalCorrect = Number(user.totalCorrect) || 0;
        const userTotalQuizzes = Number(user.totalQuizzes) || 0;
        const userStreak = Number(user.streak) || 0;

        const rankCount = await User.countDocuments({ xp: { $gt: userXP } });
        const rank = rankCount + 1;

        const accuracy = userTotalQuestions > 0
            ? Math.round((userTotalCorrect / userTotalQuestions) * 100)
            : 0;

        let level = 1;
        if (userXP >= 100) level = 2;
        if (userXP >= 300) level = 3;
        if (userXP >= 600) level = 4;
        if (userXP >= 1000) level = 5;
        if (userXP >= 1500) level = 6;

        const recentAttempts = await Result.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(5);

        let achievementCount = 0;
        if (userTotalQuizzes >= 1) achievementCount++;
        if (userTotalQuizzes >= 10) achievementCount++;
        if (userTotalQuizzes >= 50) achievementCount++;
        if (userXP >= 100) achievementCount++;
        if (userXP >= 500) achievementCount++;
        if (userXP >= 1000) achievementCount++;
        if (userStreak >= 7) achievementCount++;

        const reversed = [...recentAttempts].reverse();
        const chartLabels = reversed.map(i => i.subject || "Unknown");
        const chartData = reversed.map(i => i.accuracy || 0);

        const xpPercent = Math.min((userXP / 1500) * 100, 100);
        const achievementPercent = Math.round((achievementCount / 11) * 100);
        const quizzesPercent = Math.min(userTotalQuizzes, 100);

        return res.render("profile/index", {
            user, level, rank, accuracy,
            achievementCount, recentAttempts,
            chartLabels, chartData,
            xpPercent, achievementPercent, quizzesPercent
        });

    } catch (err) {
        console.error("PROFILE ERROR", err);
        return res.status(500).send(err.stack);
    }
};

exports.getEditProfile = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/login");

        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.session.destroy(() => { });
            return res.redirect("/login");
        }

        return res.render("profile/edit", { user, error: null });

    } catch (err) {
        console.error("EDIT PROFILE ERROR", err);
        return res.status(500).send(err.stack);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect("/login");

        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.session.destroy(() => { });
            return res.redirect("/login");
        }

        const { name, bio } = req.body;

        if (!name || !name.trim()) {
            return res.render("profile/edit", {
                user,
                error: "Name cannot be empty."
            });
        }

        user.name = name.trim();

        user.bio = typeof bio === "string" ? bio.trim() : (user.bio || "");

        await user.save();


        req.session.user.name = user.name;

        req.flash("success", "Profile updated successfully.");
        return res.redirect("/profile");

    } catch (err) {
        console.error("UPDATE PROFILE ERROR", err);
        return res.status(500).send(err.stack);
    }
};