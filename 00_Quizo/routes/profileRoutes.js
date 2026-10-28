const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const upload = require("../middleware/upload");

router.get("/", profileController.getProfile);
router.get("/edit", profileController.getEditProfile);
router.post(
	"/edit",
	upload.profileUpload.single("avatar"),
	profileController.updateProfile
);

module.exports = router;