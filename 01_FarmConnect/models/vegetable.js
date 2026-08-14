const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const vegetableSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
       url: String,
       filename: String,
    },
    price: Number,
    location: String,
    category: {
      type: String,
      enum: ['roots', 'leaves', 'pods', 'flowers','fruits'],
      required: true,
    },
    quantity: {  // Add stock quantity
      type: Number,
      required: true,
      min: 1  // Ensure stock cannot be negative
    },
    reviews: [
      { type: Schema.Types.ObjectId, ref: "Review" }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
});

// Middleware to delete reviews when a vegetable is deleted
vegetableSchema.post("findOneAndDelete", async(vegetable) => {
  if (vegetable) {
    await Review.deleteMany({ _id: { $in: vegetable.reviews } });
  }
});

const Vegetable = mongoose.model("Vegetable", vegetableSchema);
module.exports = Vegetable;
