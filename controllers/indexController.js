const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");

function randomize(array) {
  let result = [];
  let newArray = [...array];
  for (let i = 0; i < 4; i++) {
    let item = newArray[Math.floor(Math.random() * newArray.length)];
    let index = newArray.indexOf(item);
    newArray.splice(index, 1);
    result.push(item);
  }
  return result;
}

exports.index = function (req, res) {
  async.parallel(
    {
      brand(callback) {
        Brand.find().sort("descending").exec(callback);
      },
      categories(callback) {
        Category.find().exec(callback);
      },
    },
    async (err, results) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      let brandArray = await randomize(results.brand);
      // Successful, so render.
      res.render("index", {
        title: "my shop!",
        brands: brandArray,
        categories: results.categories,
      });
    }
  );
};

exports.templates = function (req, res) {
  res.render("templates");
};
