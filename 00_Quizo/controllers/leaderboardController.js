const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  

    try {

        const leaders = await User.find().sort({ xp: -1 });

        const leadersWithStats = leaders.map((user, index) => {

            const accuracy =
                user.totalQuestions > 0
                    ? Math.round(
                        (user.totalCorrect / user.totalQuestions) * 100
                    )
                    : 0;

            return {
                ...user.toObject(),
                rank: index + 1,
                accuracy
            };

        });

        let currentUserRank = null;

        if (req.session.user) {

            currentUserRank = leadersWithStats.find(
                u => u._id.toString() === req.session.user._id
            );

        }

        res.render("leaderboard/leaderboard", {
            leaders: leadersWithStats,
            currentUserRank
        });

    } catch (err) {

        console.log(err);

        res.send("Leaderboard Error");

    }

};