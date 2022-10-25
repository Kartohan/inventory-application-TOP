const Item = require("../models/item.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");

// Display list of all items.
exports.item_list = (req, res, next) => {
  Item.find()
    .populate("categories")
    .exec((err, items) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      res.render("item_list", {
        title: "Item List",
        items: items,
      });
    });
};

// Display detail page for a specific item.
exports.item_detail = (req, res, next) => {
  Item.findById(req.params.id)
    .populate("categories")
    .populate("brand")
    .exec((err, item) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      res.render("item_detail", {
        title: "Item Detail",
        item: item,
      });
    });
};

// Display item create form on GET.
exports.item_create_get = (req, res) => {
  async.parallel(
    {
      brands(callback) {
        Brand.find(callback);
      },
      categories(callback) {
        Category.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("item_form", {
        title: "Create item",
        brands: results.brands,
        categories: results.categories,
      });
    }
  );
};

// Handle item create on POST.
exports.item_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: item create POST");
};

// Display item delete form on GET.
exports.item_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: item delete GET");
};

// Handle item delete on POST.
exports.item_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: item delete POST");
};

// Display item update form on GET.
exports.item_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: item update GET");
};

// Handle item update on POST.
exports.item_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: item update POST");
};
