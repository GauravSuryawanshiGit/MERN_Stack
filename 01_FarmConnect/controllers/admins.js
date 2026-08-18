const User = require("../models/user.js");

const generateAdminToken = require("../utils/generateAdminToken.js");
const TryCatch = require("../utils/TryCatch.js");
const bcrypt = require("bcrypt");
const Order = require("../models/order.js");


module.exports.adminForm = (req, res) => {
    res.render("admin/login.ejs");
};


module.exports.adminLogin = TryCatch(async (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_UNAME && password === process.env.ADMIN_PASSWD) {

        generateAdminToken(res);

        req.flash("success", "You are logged in!");
        return res.redirect("/admin/orders");

    } else {
        req.flash("error", "Incorrect username or password!");
        return res.redirect("/admin/login");
    }
});


module.exports.viewOrders = TryCatch(async (req, res) => {

    const orders = await Order.find().populate("user").populate("assignedTo");
    const deliveryBoys = await User.find({ role: "delivery_boy" });
    res.render("admin/orders.ejs", { orders, deliveryBoys });
});


module.exports.assignOrders = TryCatch(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
        req.flash("error", "Order not found!");
        return res.redirect("/admin/orders");
    }

    if (order.status === "Delivered") {
        req.flash("error", "Cannot reassign a delivered order!");
        return res.redirect("/admin/orders");
    }

    const deliveryBoy = await User.findOne({ role: "delivery_boy" })
        .sort({ assignedOrders: 1 })
        .exec();

    if (!deliveryBoy) {
        req.flash("error", "No delivery boys available!");
        return res.redirect("/admin/orders");
    }

    if (order.assignedTo) {
        await User.findByIdAndUpdate(order.assignedTo, { $inc: { assignedOrders: -1 } });
    }


    order.assignedTo = deliveryBoy._id;
    order.status = "Assigned";
    await order.save();


    await User.findByIdAndUpdate(deliveryBoy._id, { $inc: { assignedOrders: 1 } });

    req.flash("success", `Order reassigned to ${deliveryBoy.name}`);
    res.redirect("/admin/orders");
});








module.exports.logoutAdmin = TryCatch(async (req, res) => {
    res.cookie("token", "", { maxAge: 0, httpOnly: true, sameSite: "strict" });


    req.flash("success", "You are logged out!");
    res.status(200).redirect("/admin/login");
});
