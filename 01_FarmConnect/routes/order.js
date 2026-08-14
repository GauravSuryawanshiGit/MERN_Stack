const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders.js"); // Ensure correct path
const { isAuth } = require("../middleware.js");

// ✅ Place an order
router.post("/place", isAuth, orderController.placeOrder);

// ✅ Get all orders for the authenticated user
router.get("/", isAuth, orderController.showOrder);

// ✅ Get details of a specific order
router.get("/:id", isAuth, orderController.getOrderById);

// ✅ Cancel an order
router.delete("/:id/cancel", isAuth, orderController.cancelOrder);

// ✅ Order confirmation page (after payment success)
router.get("/confirmation", (req, res) => {
    res.render("confirmation", { message: "Your order has been placed successfully! 🎉" });
});

module.exports = router;
