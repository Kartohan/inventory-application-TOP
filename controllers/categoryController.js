const Category = require("../models/category.model");
const Item = require("../models/item.model");
const async = require("async");
const { check, validationResult } = require("express-validator");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { bucket, getImage, uploadFile } = require("../firebase");

const imageFormatCheck = (req) => {
  let format = req.file.mimetype.split("/");
  if (format[1] === "jpeg" || format[1] === "png" || format[1] === "jpg") {
    return false;
  } else {
    return true;
  }
};

// Display list of all categories.
exports.category_list = async (req, res, next) => {
  const categories = await Category.find();
  // Category.find().exec((err, categories) => {
  //   if (err) {
  //     // Error in API usage.
  //     return next(err);
  //   }
  // });
  for (const category of categories) {
    category.imageUrl = await getImage(category.image);
  }
  res.render("category_list", {
    title: "Category list",
    categories: categories,
  });
};

// Display detail page for a specific category.
exports.category_detail = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }
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
    async function (err, results) {
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
      for (const item of results.category_items) {
        item.imageUrl = await getImage(item.image);
      }
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
  res.render("category_form", { title: "Create Category" });
};

// const Storage = multer.diskStorage({
//   destination: "public/uploads",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage: Storage });
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
// Handle category create on POST.
exports.category_create_post = [
  upload.single("categoryimage"),
  check("name", "Name field required").trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a brand object with escaped and trimmed data.
    let filename = req.file.originalname;
    filename = Date.now() + path.extname(req.file.originalname);

    const category = new Category({
      name: req.body.name,
      image: filename,
    });

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("category_form", {
        title: "Create Category",
        category,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if category with same name already exists.
      Category.findOne({ name: req.body.name }).exec(
        async (err, found_category) => {
          if (err) {
            return next(err);
          }
          if (found_category) {
            // category exists, redirect to its detail page.
            res.redirect(found_category.url);
          } else {
            // const params = {
            //   Bucket: bucketName,
            //   Key: filename,
            //   Body: req.file.buffer,
            //   Type: req.file.mimetype,
            // };
            // const command = new PutObjectCommand(params);
            // await s3.send(command);
            await uploadFile(req.file.buffer, filename, req.file.mimetype);
            category.save((err) => {
              if (err) {
                return next(err);
              }
              // Category saved. Redirect to genre detail page.
              res.redirect(category.url);
            });
          }
        }
      );
    }
  },
];

// Display category delete form on GET.
exports.category_delete_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }
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
    async function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.category == null) {
        // No results.
        var err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }
      for (const item of results.category_items) {
        // const getObjectParams = {
        //   Bucket: bucketName,
        //   Key: item.image,
        // };
        // const command = new GetObjectCommand(getObjectParams);
        // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        item.imageUrl = await getImage(item.image);
      }
      // const getObjectParams = {
      //   Bucket: bucketName,
      //   Key: results.category.image,
      // };
      // const command = new GetObjectCommand(getObjectParams);
      // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      results.category.imageUrl = await getImage(results.category.image);;
      // Successful, so render
      res.render("category_delete", {
        title: "Delete category",
        category: results.category,
        category_items: results.category_items,
      });
    }
  );
};

// Handle category delete on POST.
exports.category_delete_post = (req, res, next) => {
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
      if (results.category_items > 0) {
        // Category has items. Render in same way as for GET route.
        res.render("category_delete", {
          title: "Delete category",
          category: results.category,
          category_items: results.category_items,
        });
        return;
      }
      // Category has no items. Delete an object and redirect
      Category.findByIdAndRemove(
        req.body.categoryid,
        async (err, deletecategory) => {
          if (err) {
            return next(err);
          }
          bucket
            .file(deletecategory.image)
            .delete()
            .catch((err) => {
              console.error("Error deleting file:", err);
            });
          // const deleteObjectParams = {
          //   Bucket: bucketName,
          //   Key: deletecategory.image,
          // };
          // const command = new DeleteObjectCommand(deleteObjectParams);
          // await s3.send(command);
          // Success - go to item list
          res.redirect("/category");
        }
      );
    }
  );
};

// Display category update form on GET.
exports.category_update_get = (req, res, next) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isObjectId) {
    var err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }
  Category.findById(req.params.id).exec((err, category) => {
    if (err) {
      return next(err);
    }
    if (category == null) {
      // No results.
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("category_form", {
      title: "Update category",
      category: category,
    });
  });
};

// Handle category update on POST.
exports.category_update_post = [
  upload.single("categoryimage"),
  check("name", "Name field required").trim().isLength({ min: 1 }).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    let filename = req.file.originalname;
    filename = Date.now() + path.extname(req.file.originalname);

    // Create a brand object with escaped and trimmed data.
    const category = new Category({
      name: req.body.name,
      image: filename,
      _id: req.params.id,
    });

    console.log(`New categoy image first ${category.image}`);

    if (imageFormatCheck(req)) {
      errors.errors.push({
        msg: "File format must be .png, .jpg or .jpeg",
      });
    }

    if (!errors.isEmpty()) {
      // fs.unlink(req.file.path, (err) => {
      //   if (err) console.log(err.message);
      // });
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("category_form", {
        title: "Create Category",
        category,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Category.findByIdAndUpdate(
        req.params.id,
        category,
        {},
        async (err, thecategory) => {
          if (err) {
            return next(err);
          }
          bucket
            .file(thecategory.image)
            .delete()
            .catch((err) => {
              console.error("Error deleting file:", err);
            });
          // const deleteObjectParams = {
          //   Bucket: bucketName,
          //   Key: thecategory.image,
          // };
          // const deletecommand = new DeleteObjectCommand(deleteObjectParams);
          console.log(`Deleted image ${thecategory.image}`);
          // await s3.send(deletecommand);
          // const params = {
          //   Bucket: bucketName,
          //   Key: filename,
          //   Body: req.file.buffer,
          //   Type: req.file.mimetype,
          // };
          // const command = new PutObjectCommand(params);
          // await s3.send(command);
          await uploadFile(req.file.buffer, filename, req.file.mimetype);
          // Successful: redirect to book detail page.
          res.redirect(thecategory.url);
        }
      );
    }
  },
];
