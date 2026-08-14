const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            vegetable: { type: mongoose.Schema.Types.ObjectId, ref: "Vegetable", required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ],
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Pending", "Assigned", "Out for Delivery", "Delivered"],
        default: "Pending"
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User", //  delivery_boy
        default: null
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
