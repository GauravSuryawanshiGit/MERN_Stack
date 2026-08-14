const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/", profileController.getProfile);
router.get("/edit", profileController.getEditProfile);
router.post("/edit", profileController.updateProfile);

module.exports = router;