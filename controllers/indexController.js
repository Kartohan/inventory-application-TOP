const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const async = require("async");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

function randomize(array, num) {
  let result = [];
  let newArray = [...array];
  for (let i = 0; i < num; i++) {
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
        Brand.find().exec(callback);
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
      let brandArray;
      if (results.brand.length > 4) {
        brandArray = await randomize(results.brand, 4);
      } else {
        brandArray = results.brand;
      }
      let categoriesArray;
      if (results.categories.length > 6) {
        categoriesArray = await randomize(results.categories, 6);
      } else {
        categoriesArray = results.categories;
      }
      for (const item of categoriesArray) {
        const getObjectParams = {
          Bucket: bucketName,
          Key: item.image,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        item.imageUrl = url;
      }
      // Successful, so render.
      res.render("index", {
        title: "My App",
        brands: brandArray,
        categories: categoriesArray,
      });
    }
  );
};
