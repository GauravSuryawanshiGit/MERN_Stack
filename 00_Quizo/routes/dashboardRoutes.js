const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { isLoggedIn } = require("../middleware/authMiddleware");

router.get("/", isLoggedIn, dashboardController.getDashboard);
router.get("/ai/suggestions", isLoggedIn, dashboardController.getAISuggestions);

module.exports = router;
