const Order = require("../models/order.js");
const Cart = require("../models/cart.js");
const Vegetable = require("../models/vegetable.js");
const TryCatch = require("../utils/TryCatch.js");
const User = require("../models/user.js"); // Import User model


const showOrder = TryCatch(async (req, res) => {
    let orders = await Order.find({ user: req.user._id }).populate("items.vegetable");
    res.render("order/index.ejs", { orders });
});


const getOrderById = TryCatch(async (req, res) => {
    let order = await Order.findById(req.params.id).populate("items.vegetable");

    if (!order) {
        req.flash("error", "Order not found!");
        return res.redirect("/order");
    }

    res.render("order/show.ejs", { order });
});


// const placeOrder = TryCatch(async (req, res) => {
//     let cart = await Cart.findOne({ user: req.user._id }).populate("items.vegetable");

//     if (!cart || cart.items.length === 0) {
//         req.flash("error", "Your cart is empty!");
//         return res.redirect("/cart");
//     }

//     let totalPrice = 0;
//     let updates = [];

//     for (let item of cart.items) {
//         let vegetable = await Vegetable.findById(item.vegetable._id);

//         if (!vegetable) {
//             req.flash("error", `Vegetable ${item.vegetable.title} not found!`);
//             return res.redirect("/cart");
//         }

   
//         if (vegetable.quantity < item.quantity) {
//             req.flash("error", `Not enough stock for ${vegetable.title}`);
//             return res.redirect("/cart");
//         }

//         totalPrice += vegetable.price * item.quantity;

        
//         updates.push({
//             updateOne: {
//                 filter: { _id: vegetable._id },
//                 update: { $inc: { quantity: -item.quantity } } 
//             }
//         });
//     }

    
//     if (updates.length > 0) {
//         await Vegetable.bulkWrite(updates);
//     }

//     let newOrder = new Order({
//         user: req.user._id,
//         items: cart.items,
//         totalPrice
//     });

//     await newOrder.save();


//     await Cart.findOneAndDelete({ user: req.user._id });

//     req.flash("success", "Order placed successfully!");
//     res.redirect("/order");
// });


const cancelOrder = TryCatch(async (req, res) => {
    let order = await Order.findById(req.params.id).populate("items.vegetable");

    if (!order) {
        req.flash("error", "Order not found!");
        return res.redirect("/order");
    }

    let updates = [];

    for (let item of order.items) {
        let vegetable = await Vegetable.findById(item.vegetable._id);
        if (vegetable) {
            updates.push({
                updateOne: {
                    filter: { _id: vegetable._id },
                    update: { $inc: { quantity: item.quantity } } 
                }
            });
        }
    }


    if (updates.length > 0) {
        await Vegetable.bulkWrite(updates);
    }

    await Order.findByIdAndDelete(req.params.id);

    req.flash("success", "Order canceled successfully!");
    res.redirect("/order");
});


//place order
const placeOrder = TryCatch(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.vegetable");

    if (!cart || cart.items.length === 0) {
        req.flash("error", "Your cart is empty!");
        return res.redirect("/cart");
    }

    let totalPrice = 0;
    let updates = [];

    for (let item of cart.items) {
        let vegetable = await Vegetable.findById(item.vegetable._id);

        if (!vegetable) {
            req.flash("error", `Vegetable ${item.vegetable.title} not found!`);
            return res.redirect("/cart");
        }

        if (vegetable.quantity < item.quantity) {
            req.flash("error", `Not enough stock for ${vegetable.title}`);
            return res.redirect("/cart");
        }

        totalPrice += vegetable.price * item.quantity;

        updates.push({
            updateOne: {
                filter: { _id: vegetable._id },
                update: { $inc: { quantity: -item.quantity } }
            }
        });
    }

    if (updates.length > 0) {
        await Vegetable.bulkWrite(updates);
    }

    // Find the delivery boy with the least assigned orders
    let deliveryBoy = await User.findOne({ role: "delivery_boy" })
        .sort({ assignedOrders: 1 })
        .exec();

    if (!deliveryBoy) {
        req.flash("error", "No delivery boys available!");
        return res.redirect("/cart");
    }

    // Create a new order and assign it to the least busy delivery boy
    let newOrder = new Order({
        user: req.user._id,
        items: cart.items,
        totalPrice,
        assignedTo: deliveryBoy._id, // Assigning delivery boy
        status: "Assigned"
    });

    await newOrder.save();

    // Update delivery boy's assigned order count
    await User.findByIdAndUpdate(deliveryBoy._id, { $inc: { assignedOrders: 1 } });

    // Clear the cart after placing an order
    await Cart.findOneAndDelete({ user: req.user._id });

    req.flash("success", `Order placed successfully and assigned to ${deliveryBoy.name}`);
    res.redirect("/order");
});



module.exports = {
    placeOrder,
    showOrder,
    getOrderById,
    cancelOrder
};
