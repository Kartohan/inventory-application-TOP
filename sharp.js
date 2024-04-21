const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const directoryPath = "public/uploads_old";
const compressPath = "public/compressed";

// Read the contents of the directory
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const compressed = path.join(compressPath, file);
    if (fs.existsSync(filePath)) {
      sharp(filePath)
        .png({
          quality: 30,
        })
        .toFile(compressed, (err, info) => {
          if (err) {
            console.error("Error compressing image:", err);
          } else {
            console.log("Image compressed successfully:", info);
          }
        });
    } else {
      console.log("File not exists");
    }
  });

  // Log all file names in the directory
});

// Compress the image
