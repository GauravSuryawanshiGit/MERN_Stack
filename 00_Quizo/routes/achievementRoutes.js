const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/authMiddleware");

const User = require("../models/User");

router.get("/", isLoggedIn, async (req, res) => {

    try {

        const user = await User.findById(
            req.session.user._id
        );

        const achievements = [

         {
    title: "First Quiz",
    icon: "first quiz.png",
    unlocked: user.totalQuizzes >= 1
},

         {
    title: "First Quiz",
    icon: "second quiz.png",
    unlocked: user.totalQuizzes >= 1
},

         {
    title: "First Quiz",
    icon: "third quizz.png",
    unlocked: user.totalQuizzes >= 1
},

            {
                title: "XP Rookie",
                icon: "xp rooki.png",
                unlocked: user.xp >= 100
            },

            {
                title: "XP Pro",
                icon: "xp pro.png",
                unlocked: user.xp >= 500
            },

            {
                title: "XP Legend",
                icon: "xp legend.png",
                unlocked: user.xp >= 1000
            },

            {
                title: "7 Day Streak",
                icon: "7 day streak.png",
                unlocked: user.streak >= 7
            },

            {
                title: "30 Day Streak",
                icon: "30 day steak.png",
                unlocked: user.streak >= 30
            },

            {
                title: "100 Day Streak",
                icon: "100 day streak.png",
                unlocked: user.streak >= 100
            },

            {
                title: "Perfect Accuracy",
                icon: "perfect accuracy.png",
                unlocked:
                    user.totalQuestions > 0 &&
                    user.totalCorrect === user.totalQuestions
            },

            {
                title: "100 Quizzes",
                icon: "100 quizes.png",
                unlocked: user.totalQuizzes >= 100
            }

        ];

        res.render(
            "achievements/index",
            {
                achievements,
                user
            }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Achievement Error"
        );

    }

});

module.exports = router;
