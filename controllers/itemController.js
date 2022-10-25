const Item = require("../models/item.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");
const { check, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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
        Brand.find().sort({ name: 1 }).exec(callback);
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

const Storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: Storage });
// Handle item create on POST.
exports.item_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
    console.log(req.body);
  },

  // Validate and sanitize fields.
  upload.single("itemimage"),
  check("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  check("brand", "Brand must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  check("price", "Price must not be empty.")
    .trim()
    .isLength({ min: 0 })
    .escape(),
  check("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  check("stock", "Stock must not be empty")
    .trim()
    .isLength({ min: 0 })
    .escape(),
  check("category.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a item object with escaped and trimmed data.
    const item = new Item({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      brand: req.body.brand,
      categories: req.body.category,
      image: req.file.filename,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      fs.unlink(req.file.path, (err) => {
        if (err) console.log(err.message);
      });
      // Get all categories and brands for form.
      async.parallel(
        {
          brands(callback) {
            Brand.find().sort({ name: 1 }).exec(callback);
          },
          categories(callback) {
            Category.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Mark our selected categories as checked.
          for (const category of results.categories) {
            if (item.categories.includes(category._id)) {
              category.checked = "true";
            }
          }
          res.render("item_form", {
            title: "Create item",
            brands: results.brands,
            categories: results.categories,
            item,
            errors: errors.array(),
          });
        }
      );
      return;
    }

    // Data from form is valid. Save item.
    item.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new item record.
      res.redirect(item.url);
    });
  },
];

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
