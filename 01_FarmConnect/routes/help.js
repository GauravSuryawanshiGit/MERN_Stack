const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const helpController = require("../controllers/helps.js");



router.get("/", helpController.help);
router.get("/chatbot", helpController.chatbot);

module.exports = router;