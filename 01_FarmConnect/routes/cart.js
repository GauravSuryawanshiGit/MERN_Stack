const express = require("express");
const router = express.Router();
const cartController = require("../controllers/carts.js");
const Cart = require("../models/cart.js");
const Vegetable = require("../models/vegetable");
const { isAuth, isCustomer } = require("../middleware.js");

router.post('/add/:vegId', isAuth, isCustomer, cartController.addCart);

router.get("/", isAuth, isCustomer, cartController.viewCart);

router.put("/update/:id", isAuth, isCustomer, cartController.updateCart);

router.delete("/remove/:vegId", isAuth, isCustomer, cartController.deleteCart);

// router.get("/demo", cartController.demo);

module.exports = router;
