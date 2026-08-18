const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders.js");
const { isAuth } = require("../middleware.js");


router.post("/place", isAuth, orderController.placeOrder);


router.get("/", isAuth, orderController.showOrder);

router.get("/:id", isAuth, orderController.getOrderById);

router.delete("/:id/cancel", isAuth, orderController.cancelOrder);


router.get("/confirmation", (req, res) => {
    res.render("confirmation", { message: "Your order has been placed successfully! 🎉" });
});

module.exports = router;
