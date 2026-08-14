const Question = require("../models/Question");
const Result = require("../models/Result");
const User = require("../models/User");
const XLSX = require("xlsx");

exports.getAdmin = async (req, res) => {

    try {

        const {
            search = "",
            subject = "",
            difficulty = ""
        } = req.query;

        const filter = {};

        if (search) {

            filter.question = {
                $regex: search,
                $options: "i"
            };

        }

        if (subject) {

            filter.subject = subject;

        }

        if (difficulty) {

            filter.difficulty = difficulty;

        }

        const questions =
            await Question.find(filter)
                .sort({ createdAt: -1 });

        // For Filter Dropdowns

        const subjects =
            await Question.distinct("subject");

        const totalUsers =
            await User.countDocuments();

        const totalQuestions =
            await Question.countDocuments();

        const totalAttempts =
            await Result.countDocuments();

        const results =
            await Result.find();

        let averageAccuracy = 0;

        if (results.length > 0) {

            averageAccuracy =
                Math.round(
                    results.reduce(
                        (sum, r) => sum + r.accuracy,
                        0
                    ) / results.length
                );

        }

        const subjectCount = {};

        results.forEach(r => {

            if (!subjectCount[r.subject]) {
                subjectCount[r.subject] = 0;
            }

            subjectCount[r.subject]++;

        });

        let mostPopularSubject =
            "No Data";

        let maxAttempts = 0;

        for (const subject in subjectCount) {

            if (
                subjectCount[subject] >
                maxAttempts
            ) {
                maxAttempts =
                    subjectCount[subject];

                mostPopularSubject =
                    subject;
            }

        }

        const topUsers =
            await User.find()
                .sort({ xp: -1 })
                .limit(5);

        res.render("admin", {

            questions,
            subjects,
            search,
            subject,
            difficulty,
            totalUsers,
            totalQuestions,
            totalAttempts,
            averageAccuracy,
            mostPopularSubject,
            topUsers

        });

    } catch (err) {

        console.log(err);

        res.send(
            "Admin Dashboard Error"
        );

    }

};

exports.postAdd = async (req, res) => {

    const {
        subject,
        topic,
        difficulty,
        question,
        opt1,
        opt2,
        opt3,
        opt4,
        correctAnswer,
        explanation
    } = req.body;



    await Question.create({

        subject,
        topic,
        difficulty,

        question,

        options: [
            opt1,
            opt2,
            opt3,
            opt4
        ],

        correctAnswer,

        explanation

    });


    req.flash("success", "Question added successfully.");
    res.redirect("/admin");

};

exports.deleteQuestion = async (req, res) => {

    try {

        await Question.findByIdAndDelete(
            req.params.id
        );

        req.flash("success", "Question deleted successfully.");
        res.redirect("/admin");

    } catch (err) {

        console.log(err);

        res.send("Delete Error");

    }

};

// ============================
// Edit Page
// ============================

exports.getEditQuestion = async (req, res) => {

    try {

        const question = await Question.findById(
            req.params.id
        );

        res.render("editQuestion", {
            question
        });

    } catch (err) {

        console.log(err);

        res.send("Edit Page Error");

    }

};

// ============================
// Update Question
// ============================

exports.postEditQuestion = async (req, res) => {

    try {

        const {
            subject,
            topic,
            difficulty,
            question,
            opt1,
            opt2,
            opt3,
            opt4,
            correctAnswer,
            explanation
        } = req.body;

        await Question.findByIdAndUpdate(
            req.params.id,
            {

                subject,
                topic,
                difficulty,
                question,

                options: [
                    opt1,
                    opt2,
                    opt3,
                    opt4
                ],

                correctAnswer,
                explanation

            }
        );

        req.flash("success", "Question updated successfully.");
        res.redirect("/admin");

    } catch (err) {

        console.log(err);

        res.send("Update Error");

    }

};

exports.importQuestions = async (req, res) => {

    try {

        const workbook = XLSX.read(
            req.file.buffer,
            { type: "buffer" }
        );

        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];

        const rows =
            XLSX.utils.sheet_to_json(sheet);

        const questions = rows.map(row => ({

            subject: row.subject,
            topic: row.topic,
            difficulty: row.difficulty,

            question: row.question,

            options: [
                row.opt1,
                row.opt2,
                row.opt3,
                row.opt4
            ],

            correctAnswer: row.correctAnswer,

            explanation: row.explanation

        }));

        await Question.insertMany(
            questions
        );

        req.flash(
            "success",
            `${questions.length} questions imported successfully.`
        );
        res.redirect("/admin");

    } catch (err) {

        console.log(err);

        res.send("Excel Import Error");

    }

};
