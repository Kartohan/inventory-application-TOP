const admin = require("firebase-admin");
const serviceAccount = require("/etc/secrets/serviceAccountKey.json");
const sharp = require("sharp");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE,
});

const storage = admin.storage();
const bucket = storage.bucket();

async function getImage(imageName) {
  let date = new Date();
  let expiration = new Date(date);
  expiration.setDate(date.getDate() + 7);
  const file = bucket.file(`${imageName}`);
  const [url] = await file.getSignedUrl({
    expires: expiration,
    action: "read",
  });
  return url;
}

async function removeFile(path) {
  try {
    await bucket.file(path).delete();
    console.log(`File ${path} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

async function uploadFile(buffer, name, mime) {
  return new Promise((resolve, reject) => {
    sharp(buffer)
      .png({
        quality: 30,
      })
      .toBuffer()
      .then((buffer) => {
        bucket
          .file(name)
          .createWriteStream({
            metadata: {
              contentType: mime, // Set the content type of the file
            },
          })
          .on("finish", () => {
            console.log("File uploaded successfully!");
            resolve();
          })
          .on("error", (err) => {
            console.error("Error uploading image:", err);
            reject();
          })
          .end(buffer);
      });
  });
}

module.exports = { bucket, getImage, uploadFile, removeFile };
