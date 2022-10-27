const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
});

BrandSchema.virtual("url").get(function () {
  return "/brand/" + this._id;
});

module.exports = mongoose.model("Brand", BrandSchema);
