const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

/* =====================
   STUDENT DASHBOARD
===================== */
router.get(
  "/student",
  verifyToken,
  authorizeRoles("student"),
  (req, res) => {
    res.json({ message: "Student dashboard access granted" });
  }
);

/* =====================
   TEACHER DASHBOARD
===================== */
router.get(
  "/teacher",
  verifyToken,
  authorizeRoles("teacher"),
  (req, res) => {
    res.json({ message: "Teacher dashboard access granted" });
  }
);

/* =====================
   ADMIN DASHBOARD
===================== */
router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin dashboard access granted" });
  }
);

module.exports = router;