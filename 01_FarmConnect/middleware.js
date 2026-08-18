const Vegetable = require("./models/vegetable.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { vegetableSchema, reviewSchema } = require("./schema.js");
const jwt = require("jsonwebtoken");
const User = require("./models/user.js");



module.exports.isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      req.flash("error", "Please login first");
      return res.redirect("/user/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.clearCookie("token");
      req.flash("error", "Session expired");
      return res.redirect("/user/login");
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie("token");
    req.flash("error", "Please login again");
    return res.redirect("/user/login");
  }
};



module.exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vegetable = await Vegetable.findById(id);

    const token = req.cookies.token;
    if (!token) {
      req.flash("error", "Please login");
      return res.redirect("/user/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!vegetable.owner.equals(decoded.id)) {
      req.flash("error", "You do not have permission");
      return res.redirect(`/vegetables/${id}`);
    }

    next();
  } catch (err) {
    res.clearCookie("token");
    req.flash("error", "Authorization failed");
    return res.redirect("/user/login");
  }
};



module.exports.validateVegetable = (req, res, next) => {
  const { error } = vegetableSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(e => e.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(e => e.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};



module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review.author.equals(req.user._id)) {
      req.flash("error", "You do not have permission");
      return res.redirect(`/vegetables/${id}`);
    }

    next();
  } catch (err) {
    req.flash("error", "Authorization error");
    return res.redirect("/vegetables");
  }
};



module.exports.setCurrUser = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.locals.currUser = null;
    res.locals.roles = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.currUser = decoded.id;
    res.locals.roles = decoded.role;
  } catch (err) {
    console.log("Invalid token, clearing cookie");
    res.clearCookie("token");
    res.locals.currUser = null;
    res.locals.roles = null;
  }

  next();
};



module.exports.isAdminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/admin/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.redirect("/admin/login");

    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/admin/login");
  }
};



module.exports.isFarmer = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "farmer") {
      req.flash("error", "Unauthorized");
      return res.redirect("/vegetables");
    }

    next();
  } catch {
    res.clearCookie("token");
    return res.redirect("/user/login");
  }
};

module.exports.isCustomer = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "customer") {
      req.flash("error", "Unauthorized");
      return res.redirect("/vegetables");
    }

    next();
  } catch {
    res.clearCookie("token");
    return res.redirect("/user/login");
  }
};

module.exports.isdeliveryBoy = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "delivery_boy") {
      req.flash("error", "Unauthorized");
      return res.redirect("/delivery/orders");
    }

    next();
  } catch {
    res.clearCookie("token");
    return res.redirect("/user/login");
  }
};
