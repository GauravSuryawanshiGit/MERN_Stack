const User = require("../models/user.js");
const Order = require("../models/order.js");
const TryCatch = require("../utils/TryCatch.js");
const axios = require("axios");


module.exports.viewOrder = TryCatch(async (req, res) => {
    const orders = await Order.find({ assignedTo: req.user._id })
        .populate("user")
        .populate("items.vegetable");

    let customerLocations = [];

    const pendingOrders = orders.filter(order => order.status !== "Delivered");


    const locationPromises = pendingOrders.map(async (order) => {
        const address = order.user.address;
        if (!address) return null;

        try {
            const response = await axios.get(`https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${process.env.MAP_API}`);
            if (response.data && response.data.features.length > 0) {
                const [lng, lat] = response.data.features[0].geometry.coordinates;
                return { name: order.user.name, coords: [lng, lat] };
            }
        } catch (error) {
            console.error(`Error fetching coordinates for ${address}:`, error);
        }
        return null;
    });


    const resolvedLocations = await Promise.all(locationPromises);
    customerLocations = resolvedLocations.filter(loc => loc !== null);

    res.render("delivery/orders.ejs", { orders, customerLocations });
});


module.exports.updateOrderStatus = TryCatch(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order || order.status === "Delivered") {
        req.flash("error", "Invalid order or already delivered!");
        return res.redirect("/delivery/orders");
    }

    order.status = "Delivered";
    await order.save();


    await User.findByIdAndUpdate(order.assignedTo, { $inc: { assignedOrders: -1 } });

    req.flash("success", "Order marked as Delivered!");
    res.redirect("/delivery/orders");
});