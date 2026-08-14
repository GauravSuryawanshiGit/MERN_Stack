const Question = require("../models/Question");

exports.getDailyChallenge = async (req, res) => {

    try {

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

        const today = new Date();

        const dayNumber =
            Math.floor(
                today.getTime() /
                (1000 * 60 * 60 * 24)
            );

        const subject =
            subjects[
                dayNumber %
                subjects.length
            ];

        const difficulty =
            difficulties[
                dayNumber % 3
            ];

        const questions =
            await Question.aggregate([
                {
                    $match: {
                        subject,
                        difficulty
                    }
                },
                {
                    $sample: {
                        size: 10
                    }
                }
            ]);

        if (questions.length === 0) {
            req.flash(
                "info",
                `No daily challenge questions are available for ${subject} (${difficulty}) yet.`
            );
            return res.redirect("/dashboard");
        }

        res.render(
            "quiz/quiz",
            {
                questions,
                subject,
                difficulty,
                isDailyChallenge: true
            }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Challenge Error"
        );

    }

};
