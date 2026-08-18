/*configure requirements*/
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const connectDB = require("./config/db");
const Question = require("./models/Question");

const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const profileRoutes = require("./routes/profileRoutes");

/*Create app using express*/
const app = express();

/*Connecting mongoDB to app*/
connectDB();

/*configuring ejs engine & views path*/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/*Parse incoming form and JSON data*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*Serve static files from the public folder*/
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

/*Configure sessions and cookies*/
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        /*Store sessions in MongoDB*/
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI
        }),

        cookie: {
            maxAge: 1000 * 60 * 60 * 24 /*24 hours*/
        }
    })
);

/*Configure custom flash messages*/
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

/*Make user and alert data available to EJS views*/
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

    /*Remove flash message after making it available to the current request*/
    if (req.session.alert) {
        delete req.session.alert;
    }

    next();
});

/*API endpoint for retrieving available quiz subjects*/
app.get("/api/subjects", async (req, res) => {
    try {
        const subjects = await Question.distinct("subject");
        res.json(subjects);
    } catch (err) {
        res.status(500).json([]);
    }
});

/*Register application routes*/
app.use("/", authRoutes);

app.use("/ai", aiRoutes);

app.use("/quiz", quizRoutes);

app.use("/leaderboard", leaderboardRoutes);

app.use("/challenge", challengeRoutes);

app.use("/dashboard", dashboardRoutes);

app.use("/achievements", achievementRoutes);

app.use("/admin", adminRoutes);

app.use("/profile", profileRoutes);

/*Redirect old achievement URL to the achievements route*/
app.get("/achievement", (req, res) => {
    res.redirect("/achievements");
});

/*Render the home page*/
app.get("/", (req, res) => {
    res.render("index");
});

/*Testing route for checking the current session*/
app.get("/session-test", (req, res) => {
    res.json(req.session);
});

/*Testing route for checking questions stored in MongoDB*/
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

/*Testing route for checking the total number of questions*/
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

/*Handle requests for pages that do not exist*/
app.use((req, res) => {
    res.status(404).render("errors/404");
});

/*Configure application port*/
const PORT = process.env.PORT || 8080;

/*Start the Quizo server*/
app.listen(PORT, () => {
    console.log(`Quizo Running On Port ${PORT}`);
});