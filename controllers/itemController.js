require("dotenv").config();
const Item = require("../models/item.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");
const {
  check,
  body,
  checkSchema,
  validationResult,
} = require("express-validator");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const imageFormatCheck = (req) => {
  let format = req.file.mimetype.split("/");
  if (format[1] === "jpeg" || format[1] === "png" || format[1] === "jpg") {
    return false;
  } else {
    return true;
  }
};

const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretKey = process.env.AWS_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: bucketRegion,
});
// const Storage = multer.diskStorage({
//   destination: "public/uploads",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
const upload = multer({
  storage: multer.memoryStorage({
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Display list of all items.
exports.item_list = (req, res, next) => {
  Item.find()
    .populate("categories")
    .exec(async (err, items) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      for (const item of items) {
        const getObjectParams = {
          Bucket: bucketName,
          Key: item.image,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        item.imageUrl = url;
      }
      res.render("item_list", {
        title: "Item List",
        items: items,
      });
    });
};

// Display detail page for a specific item.
exports.item_detail = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }
  Item.findById(req.params.id)
    .populate("categories")
    .populate("brand")
    .exec(async (err, item) => {
      if (err) {
        // Error in API usage.
        return next(err);
      }
      const getObjectParams = {
        Bucket: bucketName,
        Key: item.image,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      item.imageUrl = url;
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
      for (const category of results.categories) {
        if (category.name === req.query.category_name) {
          category.checked = "true";
        }
      }
      for (const brand of results.brands) {
        if (brand.name === req.query.brand_name) {
          brand.selected = "true";
        }
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
exports.item_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
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
  checkSchema({
    itemimage: {
      custom: {
        options: (value, { req, location, path }) => {
          return !!req.file;
        },
        errorMessage:
          "You need to upload a product image in format .jpg, .jpeg or .png. File size should be less than 5MB",
      },
    },
  }),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    let filename = req.file.originalname;
    filename = Date.now() + path.extname(req.file.originalname);
    // Create a item object with escaped and trimmed data.
    const item = new Item({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      brand: req.body.brand,
      categories: req.body.category,
      image: undefined === req.file ? "" : filename,
    });

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      // if (!!req.file) {
      //   fs.unlink(req.file.path, (err) => {
      //     if (err) console.log(err.message);
      //   });
      // }
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
    item.save(async (err) => {
      const params = {
        Bucket: bucketName,
        Key: filename,
        Body: req.file.buffer,
        Type: req.file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      if (err) {
        return next(err);
      }
      // Successful: redirect to new item record.
      res.redirect(item.url);
    });
  },
];

// Display item delete form on GET.
exports.item_delete_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }
  Item.findById(req.params.id)
    .populate("categories")
    .exec(async (err, item) => {
      if (err) {
        return next(err);
      }
      if (item == null) {
        // No results.
        res.redirect("/item");
      }
      const getObjectParams = {
        Bucket: bucketName,
        Key: item.image,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      item.imageUrl = url;
      // Successful, so render.
      res.render("item_delete", {
        title: "Delete Item",
        item: item,
      });
    });
};

// Handle item delete on POST.
exports.item_delete_post = [
  body("word").custom((value, { req }) => {
    if (req.body.admin === "false" && !req.body.word) {
      return true;
    } else if (req.body.word === process.env.ADMIN) {
      return true;
    } else {
      throw new Error("Wrong password");
    }
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Item.findById(req.params.id)
        .populate("categories")
        .exec((err, item) => {
          if (err) {
            return next(err);
          }
          if (item == null) {
            // No results.
            res.redirect("/item");
          }
          // Successful, so render.
          res.render("item_delete", {
            title: "Delete Item",
            item: item,
            errors: errors.array(),
          });
        });
      return;
    }

    Item.findById(req.params.id, async (err, item) => {
      const deleteObjectParams = {
        Bucket: bucketName,
        Key: item.image,
      };
      const command = new DeleteObjectCommand(deleteObjectParams);
      await s3.send(command);
    });

    Item.findByIdAndRemove(req.body.itemid, async (err) => {
      if (err) {
        return next(err);
      }
      // Success - go to item list
      res.redirect("/item");
    });
  },
];

// Display item update form on GET.
exports.item_update_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }
  async.parallel(
    {
      brands(callback) {
        Brand.find().sort({ name: 1 }).exec(callback);
      },
      categories(callback) {
        Category.find(callback);
      },
      item(callback) {
        Item.findById(req.params.id)
          .populate("brand")
          .populate("categories")
          .exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        const err = new Error("Item not found");
        err.status = 404;
        return next(err);
      }
      for (const category of results.categories) {
        for (const itemCategory of results.item.categories) {
          if (category._id.toString() === itemCategory._id.toString()) {
            category.checked = "true";
          }
        }
      }
      // Successful, so render.
      res.render("item_form", {
        title: "Update item",
        brands: results.brands,
        categories: results.categories,
        item: results.item,
      });
    }
  );
};

// Handle item update on POST.
exports.item_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
  },

  // Validate and sanitize fields.
  upload.single("itemimage"),
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("brand", "Brand must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty.")
    .trim()
    .isLength({ min: 0 })
    .escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 0 }).escape(),
  body("word").custom((value, { req }) => {
    if (req.body.admin === "false" && !req.body.word) {
      return true;
    } else if (req.body.word === process.env.ADMIN) {
      return true;
    } else {
      throw new Error("Wrong password");
    }
  }),
  body("category.*").escape(),
  checkSchema({
    itemimage: {
      custom: {
        options: (value, { req, location, path }) => {
          return !!req.file;
        },
        errorMessage:
          "You need to upload a product image in format .jpg, .jpeg or .png. File size should be less than 5MB",
      },
    },
  }),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    let filename = req.file.originalname;
    filename = Date.now() + path.extname(req.file.originalname);
    // Create a item object with escaped and trimmed data.
    const item = new Item({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      stock: req.body.stock,
      brand: req.body.brand,
      categories:
        typeof req.body.category === "undefined" ? [] : req.body.category,
      image: undefined === req.file ? "" : filename,
      _id: req.params.id,
      admin: req.body.word === undefined ? false : true,
    });

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      // if (!!req.file) {
      //   fs.unlink(req.file.path, (err) => {
      //     if (err) console.log(err.message);
      //   });
      // }
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
            title: "Update item",
            brands: results.brands,
            categories: results.categories,
            item,
            errors: errors.array(),
          });
        }
      );
      return;
    }

    Item.findById(req.params.id, async (err, item) => {
      const deleteObjectParams = {
        Bucket: bucketName,
        Key: item.image,
      };
      const command = new DeleteObjectCommand(deleteObjectParams);
      await s3.send(command);
    });

    // Data from form is valid. Update the record.
    Item.findByIdAndUpdate(req.params.id, item, {}, async (err, theitem) => {
      if (err) {
        return next(err);
      }
      const params = {
        Bucket: bucketName,
        Key: filename,
        Body: req.file.buffer,
        Type: req.file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      // Successful: redirect to book detail page.
      res.redirect(theitem.url);
    });
  },
];
