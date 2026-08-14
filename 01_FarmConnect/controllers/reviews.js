const User = require("../models/user.js");
const Vegetable = require("../models/vegetable.js");
const Review = require("../models/review.js");

module.exports.createReview = async(req, res)=>{
    let vegetable = await Vegetable.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    vegetable.reviews.push(newReview);

    await newReview.save();
    await vegetable.save();

    req.flash("success", "Review Added!");
    res.redirect(`/vegetables/${req.params.id}`);

};

module.exports.deleteReview = async(req, res, next)=>{
    let {id, reviewId} = req.params;
  

    await Vegetable.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    res.redirect(`/vegetables/${id}`);
};