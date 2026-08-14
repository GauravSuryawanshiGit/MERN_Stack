const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            vegetable: { type: mongoose.Schema.Types.ObjectId, ref: "Vegetable", required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ]
});

module.exports = mongoose.model("Cart", CartSchema);
