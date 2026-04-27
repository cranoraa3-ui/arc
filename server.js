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
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

/* =====================
   SECURITY MIDDLEWARE
===================== */
// Helmet for security headers
app.use(helmet());

// CORS with restricted origin (FIXED from *)
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600
}));

// Rate limiting for brute force protection
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later.",
});

app.use(globalLimiter);

// Body parser
app.use(express.json({ limit: "10kb" })); // Limit payload size
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

/* =====================
   STATIC FILES
===================== */
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   TEST ROUTE
===================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API running",
    timestamp: new Date().toISOString()
  });
});

/* =====================
   AUTH ROUTES (with stricter rate limiting)
===================== */
app.use("/api/auth", authLimiter, authRoutes);
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
   ERROR HANDLER
===================== */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // Don't expose internal errors to client
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ CORS enabled for: ${corsOrigin}`);
    console.log("✅ Rate limiting enabled");
    app.listen(PORT);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
