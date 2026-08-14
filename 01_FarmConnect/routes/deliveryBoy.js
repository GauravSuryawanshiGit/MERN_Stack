const express = require("express");
const router = express.Router();
const Order = require("../models/order.js");
const deliveryBoyController = require("../controllers/deliveryBoys.js");
const { isAuth, isdeliveryBoy} = require("../middleware.js");


router.get("/orders",isAuth, isdeliveryBoy, deliveryBoyController.viewOrder);

router.post("/orders/:id/deliver", isAuth, isdeliveryBoy, deliveryBoyController.updateOrderStatus);

module.exports = router;