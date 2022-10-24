const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");

exports.index = function (req, res) {
  async.parallel(
    {
      brand(callback) {
        Brand.find().limit(4).exec(callback);
      },
      categories(callback) {
        Category.find().exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      // Successful, so render.
      res.render("index", {
        title: "my shop!",
        brands: results.brand,
        categories: results.categories,
      });
    }
  );
};

exports.templates = function (req, res) {
  res.render("templates");
};
