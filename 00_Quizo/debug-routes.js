const express = require("express");
const path = require("path");

const achievementRoutes = require("./routes/achievementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Test both routes side by side
app.use("/achievements", achievementRoutes);
app.use("/dashboard", dashboardRoutes);

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Catch-all for 404
app.use((req, res) => {
  console.log(`[404] No route matched for: ${req.method} ${req.path}`);
  res.status(404).send("404 - No route found");
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`\n🔍 DEBUG SERVER on port ${PORT}`);
  console.log("Try: http://localhost:8080/achievements");
  console.log("Try: http://localhost:8080/dashboard\n");
});
