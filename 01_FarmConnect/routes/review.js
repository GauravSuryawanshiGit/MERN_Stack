const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const {isReviewAuthor, isAuth, isCustomer} = require("../middleware.js");

const reviewsController = require("../controllers/reviews.js");

//Post Review Route
router.post("/", isAuth, isCustomer, wrapAsync(reviewsController.createReview));

// //Delete Review Route
router.delete("/:reviewId", isAuth, isCustomer, isReviewAuthor, wrapAsync(reviewsController.deleteReview));

module.exports = router;