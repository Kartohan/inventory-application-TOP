const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");

router.get("/create", itemController.item_create_get);

// POST request for creating item.
router.post("/create", itemController.item_create_post);

// GET request to delete item.
router.get("/:id/delete", itemController.item_delete_get);

// POST request to delete item.
router.post("/:id/delete", itemController.item_delete_post);

// GET request to update item.
router.get("/:id/update", itemController.item_update_get);

// POST request to update item.
router.post("/:id/update", itemController.item_update_post);

// GET request for one item.
router.get("/:id", itemController.item_detail);

// GET request for list of all item items.
router.get("/", itemController.item_list);

module.exports = router;
