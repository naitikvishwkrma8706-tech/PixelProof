const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

require("./config/db");

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const historyRoutes = require("./routes/historyRoutes");
app.use("/api/history", historyRoutes);

app.get("/", (req, res) => {
  res.send("PixelProof Backend is Running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
