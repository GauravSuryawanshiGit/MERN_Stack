const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const session = require("express-session");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();


const mongoURI = process.env.MONGO_URL;

if (!mongoURI) {
  console.error("❌ MONGO_URL not found in .env");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
}

connectDB();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "carboncalcsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layouts/boilerplate");

app.use(express.static(path.join(__dirname, "public")));

const User = require("./models/user");
const History = require("./models/history");

app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  res.locals.userName = req.session.userName || null;
  next();
});

function isLoggedIn(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

app.get("/", (req, res) => res.redirect("/home"));

app.get("/home", (req, res) => {
  res.render("home", { title: "Home - Carbon Footprint Calculator" });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About - Carbon Footprint Calculator" });
});

app.get("/calculator", isLoggedIn, (req, res) => {
  res.render("index", { title: "Calculator - Carbon Footprint Calculator" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login - Carbon Footprint Calculator" });
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up - Carbon Footprint Calculator" });
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword)
      return res.send("⚠️ Passwords do not match!");

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send("⚠️ User already exists. Please login.");

    const newUser = new User({ name, email, password });
    await newUser.save();

    req.session.userId = newUser._id;
    req.session.userName = newUser.name;

    res.redirect("/calculator");
  } catch (error) {
    console.error("Signup error:", error);
    res.send("❌ Error during signup.");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.send("❌ Invalid credentials!");

    req.session.userId = user._id;
    req.session.userName = user.name;

    res.redirect("/calculator");
  } catch (error) {
    console.error("Login error:", error);
    res.send("❌ Error during login.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/home");
});


app.post("/calculator", isLoggedIn, async (req, res) => {
  try {
    const { calculation, suggestion } = req.body;

    const history = new History({
      user: req.session.userId,
      calculation,
      suggestion,
    });

    await history.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Calculator save error:", error);
    res.status(500).json({ error: "❌ Error saving history" });
  }
});


app.get("/history", isLoggedIn, async (req, res) => {
  try {
    const { sort, filter } = req.query;
    let query = { user: req.session.userId };

    const now = new Date();

    if (filter === "year") {
      query.createdAt = {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    } else if (filter === "month") {
      query.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const history = await History.find(query).sort(sortOption);

    res.render("history", { title: "Your History", history });
  } catch (error) {
    console.error("History fetch error:", error);
    res.send("❌ Error fetching history");
  }
});


app.get("/chatbot", isLoggedIn, (req, res) => {
  res.render("chatbot", { title: "AI Carbon Assistant" });
});

app.post("/chatbot", isLoggedIn, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ answer: "Please enter a question." });
    }

    const prompt = `
You are an AI assistant for a Carbon Footprint Calculator.
Answer briefly and accurately.

User Question:
${question}
`;

    const result = await model.generateContent(prompt);

    res.json({ answer: result.response.text() });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ answer: "Sorry, AI Assistant is currently unavailable." });
  }
});


app.post("/suggestions", isLoggedIn, async (req, res) => {
  try {
    const { daily, monthly } = req.body;

    if (monthly <= 0 || daily <= 0) {
      return res.status(400).json({ suggestions: "⚠️ Missing footprint data." });
    }

    const prompt = `
You are a carbon footprint reduction expert.
A user has a carbon footprint of ${monthly} kg CO₂ per month (${daily} kg CO₂ per day).
Give 5 practical, specific reduction suggestions to lower their carbon footprint.
Format each suggestion with a bold title and a short explanation.
`;

    const result = await model.generateContent(prompt);

    res.json({ suggestions: result.response.text() });

  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ suggestions: "❌ Could not generate suggestions." });
  }
});

app.use((req, res) => {
  res.status(404).render("404", { title: "404 - Page Not Found" });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed.");
  } finally {
    process.exit(0);
  }
});