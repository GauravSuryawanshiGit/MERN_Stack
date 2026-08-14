const Question = require("../models/Question");
const Result = require("../models/Result");

exports.getQuiz = async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const difficulty = req.query.difficulty || "easy";

  const questions = await Question.aggregate([
    { $match: { category: req.params.category, difficulty } },
    { $sample: { size: 10 } }
  ]);

  if (questions.length === 0) {
    return res.send("No questions available for this category & difficulty.");
  }

  res.render("quiz/quiz", {
    questions,
    category: req.params.category,
    difficulty
  });
};

exports.postSubmit = async (req, res) => {
  const difficulty = req.query.difficulty || "easy";

  const questions = await Question.aggregate([
    { $match: { category: req.params.category, difficulty } },
    { $sample: { size: 10 } }
  ]);

  let correct = 0;
  questions.forEach(q => {
    if (req.body[q._id] === q.correct) correct++;
  });

  const total = questions.length;
  const accuracy = Math.round((correct / total) * 100);

  await Result.create({
    user: req.session.user.name,
    category: req.params.category,
    difficulty,
    correct,
    total,
    accuracy,
    timeTaken: req.body.time || 0
  });

  res.redirect("/leaderboard");
};
