const User = require("../models/user.js");
const generateToken = require("../utils/generateToken.js");
const TryCatch = require("../utils/TryCatch.js");
const bcrypt = require("bcrypt");

module.exports.registerForm = (req, res) => {
    res.render("users/register.ejs");
};

module.exports.registerUser = TryCatch(async (req, res) => {
    const { name, email, password, role, address } = req.body;

    if (!name || !email || !password || !role || !address) {
        req.flash("error", "All fields are required!");
        return res.redirect("/user/register");
      };

    let user = await User.findOne({ email });

    if (user){
        req.flash("error", "User already exist!");
        return res.redirect("/user/register");
    };

    const hashPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hashPassword,
        role: role,
        address,
    });

    // console.log(user);

    generateToken(user, res);

    req.flash("success", "Welcome to Passanger");
    res.redirect("/vegetables");

});

module.exports.loginForm = (req, res) => {
    res.render("users/login.ejs");
};


module.exports.loginUser = TryCatch(async (req, res) => {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });

    if (!user){
        req.flash("error", "Incorrect email or password!");
        return res.redirect("/user/login");
    };
    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword){
        req.flash("error", "Incorrect email or password!");
        return res.redirect("/user/login");
    };

    if(user.role!=role){
        req.flash("error", "Incorrect Role!");
        return res.redirect("/user/login");
    };
        
    generateToken(user, res);

    req.flash("success", "You are logged in!");
    res.redirect("/vegetables");

});

module.exports.myProfile = TryCatch(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("profile/profile.ejs", { user });
});

module.exports.userProfile = TryCatch(async (req, res) => {
    const user = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!user) {
    req.flash("error", "User not found!");
    return res.status(404).redirect("/vegetables");
  }

  res.render("profile/user.ejs", { user});
});


module.exports.logOutUser = TryCatch(async (req, res) => {
    res.cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "strict" });


    req.flash("success", "You are logged out!");
    res.status(200).redirect("/user/login");
});