const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/authMiddleware");

const challengeController =
    require("../controllers/challengeController");

router.get(
    "/",
    isLoggedIn,
    challengeController.getDailyChallenge
);

module.exports = router;
