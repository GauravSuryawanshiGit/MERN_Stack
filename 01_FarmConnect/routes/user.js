const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const userController = require("../controllers/users.js");
const { isAuth } = require("../middleware.js");



router.get("/register", userController.registerForm);
router.post("/register", userController.registerUser);

router.get("/login", userController.loginForm);
router.post("/login", userController.loginUser);
router.get("/logout", isAuth, userController.logOutUser);

router.get("/me", isAuth, userController.myProfile);
router.get("/:id", isAuth, userController.userProfile);



module.exports = router;