const express = require("express");
const router = express.Router();

const Question = require("../models/Question");
const Result = require("../models/Result");
const User = require("../models/User");
const { isLoggedIn } = require("../middleware/authMiddleware");

// =========================
// Start Quiz
// =========================
router.get("/start", isLoggedIn, async (req, res) => {

    const { subject, difficulty, count } = req.query;

    if (!subject || !difficulty || !count) {

        req.flash("warning", "Please select all quiz options.");

        return res.redirect("/");

    }

    const totalQuestions = Number(count);

    const questions = await Question.aggregate([

        {
            $match: {
                subject,
                difficulty
            }
        },

        {
            $sample: {
                size: totalQuestions
            }
        }

    ]);

    if (questions.length === 0) {

        req.flash("info", "No questions available for this selection.");

        return res.redirect("/");

    }

    res.render("quiz/quiz", {

        questions,

        subject,

        difficulty

    });

});
// =========================
// Submit Quiz
// =========================

router.post("/submit", isLoggedIn, async (req, res) => {

    try {

        const questionIds = Object.keys(req.body).filter(
            key =>
                key !== "subject" &&
                key !== "difficulty" &&
                key !== "quizTime" &&
                key !== "isDailyChallenge"
        );

        if (questionIds.length === 0) {
            req.flash("error", "No quiz answers were submitted.", "Quiz submission failed", {
                mode: "modal"
            });
            return res.redirect("/");
        }

        const questions = await Question.find({
            _id: {
                $in: questionIds
            }
        });

        let correct = 0;

        questions.forEach(q => {

            if (
                req.body[q._id.toString()] ===
                q.correctAnswer
            ) {
                correct++;
            }

        });

        const total = questions.length;

        const accuracy =
            total > 0
                ? Math.round(
                    (correct / total) * 100
                )
                : 0;

       const xp = correct * 10;

let bonusXP = 0;

if(req.body.isDailyChallenge){

    const challengeUser =
    await User.findById(
        req.session.user._id
    );

    const todayDate =
    new Date();

    todayDate.setHours(0,0,0,0);

    let alreadyCompleted = false;

    if(challengeUser.lastChallengeCompleted){

        const lastCompleted =
        new Date(
            challengeUser.lastChallengeCompleted
        );

        lastCompleted.setHours(0,0,0,0);

        alreadyCompleted =
            lastCompleted.getTime() ===
            todayDate.getTime();

    }

    if(!alreadyCompleted){

        bonusXP = 100;

        await User.findByIdAndUpdate(
            challengeUser._id,
            {
                $set:{
                    lastChallengeCompleted:
                    new Date()
                }
            }
        );

    }

}

const totalXP =
    xp + bonusXP;

        console.log(
            "Quiz Time:",
            req.body.quizTime
        );

        // Save Result

        const savedResult =
        await Result.create({

            quizTime:
                Number(req.body.quizTime || 0),

            userId:
                req.session.user._id,

            username:
                req.session.user.name,

            subject:
                req.body.subject,

            difficulty:
                req.body.difficulty,

            correct,
            total,
            accuracy,
           xp: totalXP,

            answers:
                req.body

        });

        // Update User Stats

// =========================
// Streak Logic
// =========================

const user =
await User.findById(
    req.session.user._id
);

let newStreak = 1;

const today = new Date();

today.setHours(0,0,0,0);

if(user.lastQuizDate){

    const lastDate =
    new Date(user.lastQuizDate);

    lastDate.setHours(0,0,0,0);

    

    const diffDays =
    Math.floor(
        (today - lastDate) /
        (1000 * 60 * 60 * 24)
    );

    if(diffDays === 0){

        newStreak = user.streak;

    }
    else if(diffDays === 1){

        newStreak =
        user.streak + 1;

    }
    else{

        newStreak = 1;

    }

}

// =========================
// Update User
// =========================

await User.findByIdAndUpdate(
    req.session.user._id,
    {
        $inc:{
           xp: totalXP,
            totalQuizzes: 1,
            totalCorrect: correct,
            totalQuestions: total
        },

        $set:{
            streak: newStreak,
            lastQuizDate: new Date()
        }
    }
);

      res.locals.alert = {
        type: "success",
        title: "Quiz submitted",
        message: bonusXP > 0
            ? `Great work! You earned ${totalXP} XP including your daily challenge bonus.`
            : `Great work! You earned ${totalXP} XP.`,
        mode: "modal",
        confirmButtonText: "View results"
      };

      res.render(
    "quiz/result",
    {
        correct,
        total,
        accuracy,
        xp: totalXP,
        bonusXP,
        quizTime:
            Number(
                req.body.quizTime || 0
            ),
        resultId:
            savedResult._id
    }
);

    } catch (err) {

        console.log(err);

        res.send(
            "Quiz Submission Error"
        );

    }

});

// =========================
// Review Answers
// =========================

router.get("/review/:id", isLoggedIn, async (req, res) => {

    try {

        const result =
        await Result.findById(
            req.params.id
        );

        if (!result) {
            req.flash("error", "That quiz result could not be found.");
            return res.redirect("/dashboard");
        }

        const questions =
        await Question.find({
            _id: {
                $in: Object.keys(
                    result.answers
                ).filter(
                    id => id.length === 24
                )
            }
        });

        res.render(
            "quiz/review",
            {
                result,
                questions
            }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Review Page Error"
        );

    }

});

module.exports = router;
