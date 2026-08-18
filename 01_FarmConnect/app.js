
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cookieParser = require("cookie-parser");



const ExpressError = require("./utils/ExpressError");



const vegetableRouter = require("./routes/vegetable");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const adminRouter = require("./routes/admin");
const deliveryBoyRouter = require("./routes/deliveryBoy");
const helpRouter = require("./routes/help");



const { setCurrUser } = require("./middleware");



const ATLAS_URL = process.env.ATLAS_DB_URL;

async function main() {
    await mongoose.connect(ATLAS_URL);
}

main()
    .then(() => console.log("connected to DB"))
    .catch(err => console.log(err));




app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());




app.use((req, res, next) => {
    res.locals.success = req.cookies.success || null;
    res.locals.error = req.cookies.error || null;

    res.clearCookie("success");
    res.clearCookie("error");

    req.flash = (type, message) => {
        if (type === "success") {
            res.cookie("success", message, { httpOnly: true });
        } else if (type === "error") {
            res.cookie("error", message, { httpOnly: true });
        }
    };

    next();
});


app.use(setCurrUser);




app.get("/", (req, res) => {
    res.render("vegetables/home.ejs");
});



app.use("/vegetables", vegetableRouter);
app.use("/vegetables/:id/reviews", reviewRouter);
app.use("/user", userRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/admin", adminRouter);
app.use("/delivery", deliveryBoyRouter);
app.use("/help", helpRouter);




app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Not Found!"));
});




app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("vegetables/error.ejs", { message });
});




const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
});
