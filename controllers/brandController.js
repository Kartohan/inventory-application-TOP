const Brand = require("../models/brand.model");
const Item = require("../models/item.model");
const async = require("async");
const { check, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const imageFormatCheck = (req) => {
  let format = req.file.mimetype.split("/");
  if (format[1] === "jpeg" || format[1] === "png" || format[1] === "jpg") {
    return false;
  } else {
    return true;
  }
};

// Display list of all Brands.
exports.brand_list = (req, res) => {
  Brand.find().exec((err, brands) => {
    if (err) {
      // Error in API usage.
      return next(err);
    }
    res.render("brand_list", {
      title: "Brand list",
      brands: brands,
    });
  });
};

// Display detail page for a specific Brand.
exports.brand_detail = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Brand not found");
    err.status = 404;
    return next(err);
  }
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },

      brand_items: function (callback) {
        Item.find({ brand: req.params.id })
          .populate("categories")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("brand_detail", {
        title: "Brand Detail",
        brand: results.brand,
        brand_items: results.brand_items,
      });
    }
  );
};

// Display Brand create form on GET.
exports.brand_create_get = (req, res, next) => {
  res.render("brand_form", { title: "Create Brand" });
};

const Storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: Storage });

// Handle Brand create on POST.
exports.brand_create_post = [
  upload.single("brandimage"),
  check("name", "Brand name required").trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a brand object with escaped and trimmed data.
    const brand = new Brand({
      name: req.body.name,
      image: req.file.filename,
    });

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log(err.message);
      });
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("brand_form", {
        title: "Create Brand",
        brand,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if brand with same name already exists.
      Brand.findOne({ name: req.body.name }).exec((err, found_brand) => {
        if (err) {
          return next(err);
        }
        if (found_brand) {
          // brand exists, redirect to its detail page.
          res.redirect(found_brand.url);
        } else {
          brand.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(brand.url);
          });
        }
      });
    }
  },
];

// Display Brand delete form on GET.
exports.brand_delete_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Brand not found");
    err.status = 404;
    return next(err);
  }
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },

      brand_items: function (callback) {
        Item.find({ brand: req.params.id })
          .populate("categories")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand == null) {
        // No results.
        var err = new Error("Brand not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("brand_delete", {
        title: "Delete Brand",
        brand: results.brand,
        brand_items: results.brand_items,
      });
    }
  );
};

// Handle Brand delete on POST.
exports.brand_delete_post = (req, res, next) => {
  async.parallel(
    {
      brand: function (callback) {
        Brand.findById(req.params.id).exec(callback);
      },

      brand_items: function (callback) {
        Item.find({ brand: req.params.id })
          .populate("categories")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.brand_items > 0) {
        // Brand has items. Render in same way as for GET route.
        res.render("brand_delete", {
          title: "Delete Brand",
          brand: results.brand,
          brand_items: results.brand_items,
        });
        return;
      }
      // Brand has no items. Delete an object and redirect
      Brand.findByIdAndRemove(req.body.brandid, (err) => {
        if (err) {
          return next(err);
        }
        fs.unlink(path.join("public/uploads", req.body.imagename), (err) => {
          if (err) console.log(err.message);
        });
        // Success - go to item list
        res.redirect("/brand");
      });
    }
  );
};

// Display Brand update form on GET.
exports.brand_update_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Brand not found");
    err.status = 404;
    return next(err);
  }
  Brand.findById(req.params.id).exec((err, brand) => {
    if (err) {
      return next(err);
    }
    if (brand == null) {
      // No results.
      const err = new Error("Brand not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("brand_form", {
      title: "Update brand",
      brand: brand,
    });
  });
};

// Handle Brand update on POST.
exports.brand_update_post = [
  upload.single("brandimage"),
  check("name", "Brand name required").trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a brand object with escaped and trimmed data.
    const brand = new Brand({
      name: req.body.name,
      image: req.file.filename,
      _id: req.params.id,
    });

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log(err.message);
      });
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("brand_form", {
        title: "Create Brand",
        brand,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      Brand.findById(req.params.id, (err, brand) => {
        fs.unlink(path.join("public/uploads", brand.image), (err) => {
          if (err) console.log(err.message);
        });
      });

      // Data from form is valid. Update the record.
      Brand.findByIdAndUpdate(req.params.id, brand, {}, (err, thebrand) => {
        if (err) {
          return next(err);
        }
        // Successful: redirect to book detail page.
        res.redirect(thebrand.url);
      });
    }
  },
];
