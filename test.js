const fs = require("fs");

fs.unlink(
  "/home/kartoshechka/repos/inventory-application-TOP-project/public/uploads/1666733698652.jpg",
  (err) => {
    if (err) console.log(err.message);
  }
);
