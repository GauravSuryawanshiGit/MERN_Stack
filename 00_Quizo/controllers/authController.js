
const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.getSignup = (req, res) => {
    if (req.session.user) {
        req.flash("info", "You are already logged in.", {
            mode: "modal"
        });
        return res.redirect("/dashboard");
    }

    res.render("auth/signup");
};

exports.getLogin = (req, res) => {
    if (req.session.user) {
        req.flash("info", "You are already logged in.", {
            mode: "modal"
        });
        return res.redirect("/dashboard");
    }

    res.render("auth/login");
};

exports.postSignup = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).render("auth/user-exists", {
                email
            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({

            name,
            email,
            password: hashedPassword

        });

        req.flash("success", "Your account has been created successfully.", "Signup successful", {
            mode: "modal",
            confirmButtonText: "Continue to login"
        });

        return res.redirect("/login");

    } catch (err) {

        console.log(err);

        req.flash("error", "Signup failed. Please try again.", "Signup failed", {
            mode: "modal"
        });

        return res.redirect("/signup");

    }

};

exports.postLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            req.flash("error", "No account was found with that email.", "Login failed", {
                mode: "modal"
            });

            return res.redirect("/login");

        }

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {

            req.flash("error", "The password you entered is incorrect.", "Login failed", {
                mode: "modal"
            });

            return res.redirect("/login");

        }

        req.session.user = {

            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role

        };

        req.flash("success", `Welcome back, ${user.name}!`, "Login successful", {
            mode: "modal",
            confirmButtonText: "Open dashboard"
        });

        return res.redirect("/dashboard");

    } catch (err) {

        console.log(err);

        req.flash("error", "Login failed. Please try again.", "Login failed", {
            mode: "modal"
        });

        return res.redirect("/login");

    }

};

exports.logout = (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.log(err);

            return res.redirect("/");

        }

        return res.redirect("/login?logout=true");

    });

};

