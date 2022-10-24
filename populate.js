#! /usr/bin/env node

console.log(
  "This script populates some test brands, categories and items to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0.a9azn.mongodb.net/local_library?retryWrites=true"
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
const async = require("async");
const Brand = require("./models/brand.model");
const Category = require("./models/category.model");
const Item = require("./models/item.model");

const mongoose = require("mongoose");
const mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const brands = [];
const categories = [];
const items = [];

function brandCreate(name, image, cb) {
  const brand = new Brand({
    name: name,
    image: image,
  });

  brand.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Brand: " + brand);
    brands.push(brand);
    cb(null, brand);
  });
}

function categoryCreate(name, image, cb) {
  const category = new Category({
    name: name,
    image: image,
  });

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    categories.push(category);
    cb(null, category);
  });
}

function itemCreate(
  name,
  price,
  description,
  stock,
  brand,
  categories,
  image,
  cb
) {
  itemdetail = {
    name: name,
    price: price,
    description: description,
    stock: stock,
    image: image,
  };
  if (brand != false) itemdetail.brand = brand;
  if (categories != false) itemdetail.categories = categories;

  const item = new Item(itemdetail);
  item.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Item: " + item);
    items.push(item);
    cb(null, item);
  });
}

function createBrandsAndCategories(cb) {
  async.series(
    [
      function (callback) {
        brandCreate("Apple", "applelogo.png", callback);
      },
      function (callback) {
        brandCreate("Indesit", "indesitlogo.png", callback);
      },
      function (callback) {
        brandCreate("Xiaomi", "xiaomilogo.png", callback);
      },
      function (callback) {
        brandCreate("Gucci", "guccilogo.png", callback);
      },
      function (callback) {
        brandCreate("Samsung", "samsunglogo.png", callback);
      },
      function (callback) {
        brandCreate("Zara", "zaralogo.png", callback);
      },
      function (callback) {
        categoryCreate("Phone", "phone.png", callback);
      },
      function (callback) {
        categoryCreate("Bag", "bag.png", callback);
      },
      function (callback) {
        categoryCreate("T-shirt", "tshirt.png", callback);
      },
      function (callback) {
        categoryCreate("Washing Machine", "washingmachine.png", callback);
      },
      function (callback) {
        categoryCreate("Fridge", "fridge.png", callback);
      },
    ],
    // optional callback
    cb
  );
}

function createItems(cb) {
  async.parallel(
    [
      function (callback) {
        itemCreate(
          "iPhone 13 Pro Max",
          1000,
          "What a phone!",
          3,
          [brands[0]],
          [categories[0]],
          "iphone.png",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Xiaomi Redmi Note 11 Pro",
          250,
          "Phone",
          10,
          [brands[2]],
          [categories[0]],
          "xiaomi.png",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Indesit OMTWE 2134512",
          750,
          "Washes your clothes",
          15,
          [brands[1]],
          [categories[3]],
          "washing.png",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Samsung RB38T600",
          500,
          "This is the Best Refrigirator!",
          10,
          [brands[4]],
          [categories[4]],
          "samsungfridge.png",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Ophidoa GG",
          1000,
          "Bag for your girlfriend!",
          13,
          [brands[3]],
          [categories[1]],
          "guccibag.png",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "KNIT T-shirt",
          1000,
          "We have every size of this!",
          75,
          [brands[5]],
          [categories[2]],
          "zaratshirt.png",
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

async.series(
  [createBrandsAndCategories, createItems],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
