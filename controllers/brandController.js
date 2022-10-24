const Brand = require("../models/brand.model");

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
exports.brand_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: Brand detail: ${req.params.id}`);
};

// Display Brand create form on GET.
exports.brand_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand create GET");
};

// Handle Brand create on POST.
exports.brand_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand create POST");
};

// Display Brand delete form on GET.
exports.brand_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand delete GET");
};

// Handle Brand delete on POST.
exports.brand_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand delete POST");
};

// Display Brand update form on GET.
exports.brand_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand update GET");
};

// Handle Brand update on POST.
exports.brand_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Brand update POST");
};
