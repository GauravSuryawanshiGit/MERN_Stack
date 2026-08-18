
exports.isAdmin = (req, res, next) => {
    if (!req.session.user) {
        req.flash("warning", "Please log in to access the admin panel.");
        return res.redirect("/login");
    }

    if (req.session.user.role === "admin") {
        return next();
    }

    req.flash("error", "Only admins can access that page.");

    return res.redirect("/");

};
