// backend/src/routes/authRoutes.js
const express = require("express");
const router  = express.Router();
const authController     = require("../controllers/authController");
const passwordController = require("../controllers/passwordController");
const protect = require("../middleware/auth");

// ── Public ──────────────────────────────────
router.post("/register", authController.register);
router.post("/login",    authController.login);

// ── Forgot / reset password (public) ────────
router.post("/forgot-password", passwordController.forgotPassword);
router.post("/reset-password",  passwordController.resetPassword);

// ── Protected ───────────────────────────────
router.get ("/me",              protect, authController.getMe);
router.put ("/update-profile",  protect, authController.updateProfile);
router.post("/change-password", protect, authController.changePassword);

module.exports = router;