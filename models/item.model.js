const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  brand: [
    {
      type: Schema.Types.ObjectId,
    },
  ],
  categories: [
    {
      type: Schema.Types.ObjectId,
    },
  ],
  image: { type: String, required: true },
});
//Virtual

ItemSchema.virtual("url").get(function () {
  return "/item/" + this._id;
});

module.exports = mongoose.model("Item", ItemSchema);
