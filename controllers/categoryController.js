const Category = require("../models/category.model");
const Item = require("../models/item.model");
const async = require("async");

// Display list of all categories.
exports.category_list = (req, res) => {
  Category.find().exec((err, categories) => {
    if (err) {
      // Error in API usage.
      return next(err);
    }
    res.render("category_list", {
      title: "Category list",
      categories: categories,
    });
  });
};

// Display detail page for a specific category.
exports.category_detail = (req, res, next) => {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.params.id).exec(callback);
      },

      category_items: function (callback) {
        Item.find({ categories: req.params.id })
          .populate("brand")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.category == null) {
        // No results.
        var err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("category_detail", {
        title: "Category Detail",
        category: results.category,
        category_items: results.category_items,
      });
    }
  );
};

// Display category create form on GET.
exports.category_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: category create GET");
};

// Handle category create on POST.
exports.category_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: category create POST");
};

// Display category delete form on GET.
exports.category_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: category delete GET");
};

// Handle category delete on POST.
exports.category_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: category delete POST");
};

// Display category update form on GET.
exports.category_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: category update GET");
};

// Handle category update on POST.
exports.category_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: category update POST");
};
