require("dotenv").config();

setTimeout(() => {
  require("./utils/otpCleanup");
}, 1000);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* =====================
   STATIC FILES (IMPORTANT FIX)
   This serves /public folder
===================== */
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   TEST ROUTE
===================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running"
  });
});

/* =====================
   AUTH ROUTES
===================== */
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* =====================
   404 HANDLER
===================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
  });
});

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    console.log("Server running on port", PORT);
    console.log("Static files served from /public");
    app.listen(PORT);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });