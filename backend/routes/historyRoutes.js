const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  saveHistory,
  getHistory,
  uploadImage,
} = require("../controllers/historyController");

// Save detection history
router.post("/", authMiddleware, saveHistory);

// Get detection history
router.get("/", authMiddleware, getHistory);

// Upload image and save it in history
router.post("/upload", authMiddleware, upload.single("image"), uploadImage);

module.exports = router;
