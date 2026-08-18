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
    enum: ['roots', 'leaves', 'pods', 'flowers', 'fruits'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reviews: [
    { type: Schema.Types.ObjectId, ref: "Review" }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

vegetableSchema.post("findOneAndDelete", async (vegetable) => {
  if (vegetable) {
    await Review.deleteMany({ _id: { $in: vegetable.reviews } });
  }
});

const Vegetable = mongoose.model("Vegetable", vegetableSchema);
module.exports = Vegetable;
