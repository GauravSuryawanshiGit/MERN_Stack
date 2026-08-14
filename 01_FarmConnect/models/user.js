const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['farmer', 'customer', 'delivery_boy'],
      required: true,
    },
    address: String,
    assignedOrders: { 
      type: Number, 
      default: 0, 
      required: function() { return this.role === "delivery_boy"; } // Only for delivery boys
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);