
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const connectDB = require("./config/db");

// Models
const Question = require("./models/Question");

// Routes
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// =========================
// Database
// =========================

connectDB();

// =========================
// View Engine
// =========================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =========================
// Middleware
// =========================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);



// =========================
// Session
// =========================

app.use(
    session({
        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI
        }),

        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// =========================
// Global Variables + Alerts
// =========================

app.use((req, res, next) => {
    req.flash = (type, message, titleOrOptions, maybeOptions) => {
        const title =
            typeof titleOrOptions === "string"
                ? titleOrOptions
                : null;

        const options =
            typeof titleOrOptions === "object" && titleOrOptions !== null
                ? titleOrOptions
                : maybeOptions || {};

        req.session.alert = {
            type,
            message,
            title,
            mode: options.mode || "toast",
            confirmButtonText: options.confirmButtonText || "OK"
        };
    };

    next();
});

app.use((req, res, next) => {
    const queryAlert =
        req.query.logout === "true"
            ? {
                type: "success",
                title: "Logged out",
                message: "You have been logged out successfully.",
                mode: "toast",
                confirmButtonText: "OK"
            }
            : null;

    res.locals.user = req.session.user || null;
    res.locals.alert = req.session.alert || queryAlert || null;

    if (req.session.alert) {
        delete req.session.alert;
    }

    next();
});




app.get("/api/subjects", async (req, res) => {

    try{

        const subjects = await Question.distinct("subject");

        res.json(subjects);

    }catch(err){

        res.status(500).json([]);

    }

});


// =========================
// Routes
// =========================

app.use("/", authRoutes);

app.use("/ai", aiRoutes);

app.use("/quiz", quizRoutes);

app.use("/leaderboard", leaderboardRoutes);

app.use("/challenge", challengeRoutes);

app.use("/dashboard", dashboardRoutes);

app.use("/achievements", achievementRoutes);

app.use("/admin", adminRoutes);

app.use("/profile", profileRoutes);

// Redirect singular to plural

app.get("/achievement", (req, res) => {
    res.redirect("/achievements");
});

// =========================
// Home
// =========================

app.get("/", (req, res) => {
    res.render("index");
});

// =========================
// Debug Routes
// =========================

app.get("/session-test", (req, res) => {
    res.json(req.session);
});

app.get("/check-questions", async (req, res) => {

    try {

        const questions = await Question.find({});

        res.json(questions);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

app.get("/stats", async (req, res) => {

    try {

        const count = await Question.countDocuments();

        res.json({
            totalQuestions: count
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// app.get("/flash-test", (req, res) => {

//     req.flash("success", "Flash is Working!");

//     res.redirect("/");

// });


// =========================
// 404
// =========================

app.use((req, res) => {
    res.status(404).render("errors/404");

});

// =========================
// Start Server
// =========================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {

    console.log(`🚀 Quizo Running On Port ${PORT}`);

});

