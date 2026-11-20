const db = require("../config/db");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const runPython = promisify(execFile);

// Python and AI model paths
// Python and AI model paths
const PYTHON_PATH =
  process.env.PYTHON_PATH ||
  (process.platform === "win32"
    ? path.resolve(__dirname, "../../ai-model/venv/Scripts/python.exe")
    : "python3");

const PREDICT_SCRIPT = path.resolve(__dirname, "../../ai-model/predict.py");

// Save detection history
const saveHistory = async (req, res) => {
  try {
    const { image_name, prediction, confidence } = req.body;
    const userId = req.user.id;

    if (!image_name) {
      return res.status(400).json({
        message: "Image name is required.",
      });
    }

    const validPredictions = ["Real", "AI Generated"];

    if (prediction != null && !validPredictions.includes(prediction)) {
      return res.status(400).json({
        message: "Invalid prediction value.",
      });
    }

    if (
      confidence != null &&
      (!Number.isFinite(Number(confidence)) ||
        Number(confidence) < 0 ||
        Number(confidence) > 100)
    ) {
      return res.status(400).json({
        message: "Confidence must be between 0 and 100.",
      });
    }

    const [result] = await db.promise().execute(
      `INSERT INTO detection_history
       (user_id, image_name, prediction, confidence)
       VALUES (?, ?, ?, ?)`,
      [userId, image_name, prediction ?? null, confidence ?? null],
    );

    return res.status(201).json({
      message: "Detection history saved successfully!",
      historyId: result.insertId,
    });
  } catch (error) {
    console.error("Save History Error:", error);

    return res.status(500).json({
      message: "Failed to save detection history.",
    });
  }
};

// Get logged-in user's detection history
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [history] = await db.promise().execute(
      `SELECT id, image_name, prediction, confidence, created_at
       FROM detection_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    return res.status(200).json({
      message: "History fetched successfully!",
      history,
    });
  } catch (error) {
    console.error("Get History Error:", error);

    return res.status(500).json({
      message: "Failed to fetch detection history.",
    });
  }
};

// Upload image, predict using AI model and save result
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image.",
      });
    }

    const userId = req.user.id;
    const imageName = req.file.originalname;
    const imagePath = `/uploads/${req.file.filename}`;

    // Run Python AI prediction
    const { stdout } = await runPython(
      PYTHON_PATH,
      [PREDICT_SCRIPT, req.file.path],
      {
        windowsHide: true,
        timeout: 60000,
      },
    );

    const aiResult = JSON.parse(stdout.trim());

    if (aiResult.error) {
      throw new Error(aiResult.error);
    }

    // Convert Python labels into application labels
    const prediction = aiResult.prediction === "FAKE" ? "AI Generated" : "Real";

    const confidence = aiResult.confidence;

    // Save upload and prediction in MySQL
    const [result] = await db.promise().execute(
      `INSERT INTO detection_history
       (user_id, image_name, image_path, prediction, confidence)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, imageName, imagePath, prediction, confidence],
    );

    return res.status(201).json({
      message: "Image analyzed successfully!",
      historyId: result.insertId,
      imageName,
      imagePath,
      prediction,
      confidence,
    });
  } catch (error) {
    console.error("AI Image Detection Error:", error);

    return res.status(500).json({
      message: "Image analysis failed. Please try again.",
    });
  }
};

module.exports = { saveHistory, getHistory, uploadImage };
