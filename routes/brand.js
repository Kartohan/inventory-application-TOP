const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");

router.get("/create", brandController.brand_create_get);

// POST request for creating Book.
router.post("/create", brandController.brand_create_post);

// GET request to delete Book.
router.get("/:id/delete", brandController.brand_delete_get);

// POST request to delete Book.
router.post("/:id/delete", brandController.brand_delete_post);

// GET request to update Book.
router.get("/:id/update", brandController.brand_update_get);

// POST request to update Book.
router.post("/:id/update", brandController.brand_update_post);

// GET request for one Book.
router.get("/:id", brandController.brand_detail);

// GET request for list of all Book items.
router.get("/", brandController.brand_list);

module.exports = router;
