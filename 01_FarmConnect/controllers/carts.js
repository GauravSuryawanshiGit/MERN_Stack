const Cart = require("../models/cart.js");
// const User = require("../models/user.js");
const Vegetable = require("../models/vegetable.js");
// const Review = require("../models/review.js");

const TryCatch = require("../utils/TryCatch.js");


module.exports.addCart = TryCatch(async (req, res) => {
    // console.log("helloadddcart");

    let { vegId } = req.params;
    let { quantity } = req.body; 
    let userId = req.user._id;

    quantity = Math.max(1, parseInt(quantity)); // ensure qty 1

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    let itemIndex = cart.items.findIndex(item => item.vegetable.toString() === vegId);
    
    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
    } else {
        cart.items.push({ vegetable: vegId, quantity });
    }

    await cart.save();
    req.flash("success", "Added to cart!");
    res.redirect("/cart");
});

// View Cart
module.exports.viewCart = TryCatch(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.vegetable");
    // console.log(cart);
    // res.send("ok");
    res.render("cart/index2.ejs", { cart });
});

// Remove item cart
module.exports.deleteCart = TryCatch(async (req, res) => {
    let { vegId } = req.params;
    let cart = await Cart.findOne({ user: req.user._id });

    cart.items = cart.items.filter(item => item.vegetable.toString() !== vegId);
    await cart.save();

    req.flash("success", "Removed from cart!");
    res.redirect("/cart");
});


module.exports.updateCart = TryCatch(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
        req.flash("error", "Quantity must be at least 1.");
        return res.redirect("/cart");
    }

    let cart = await Cart.findOne({ user: req.user._id });
    // console.log(cart.item.vegetable);

    if (!cart) {
        req.flash("error", "Cart not found!");
        return res.redirect("/cart");
    }

    let cartItem = cart.items.find(item => item.vegetable.toString() === id);

    if (!cartItem) {
        req.flash("error", "Item not found in cart.");
        return res.redirect("/cart");
    }

    cartItem.quantity = parseInt(quantity);
    await cart.save(); 

    req.flash("success", "Cart updated successfully!");
    res.redirect("/cart");
});

