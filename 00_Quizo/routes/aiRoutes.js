const express = require("express");

const router = express.Router();

const aiController = require("../controllers/aiController");

router.post("/", aiController.askAI);

module.exports = router;