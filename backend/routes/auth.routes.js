const express = require("express");

const {
  signup,
  verifyEmail,
  newVerificationCode,
  login,
  forgetPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();

// Registration
router.post("/signup", signup);

// User Verification
router.post("/verifyemail", verifyEmail);
router.post("/new-verification-code", newVerificationCode);

// Login
router.post("/login", login);

// Forget or Reset Password
router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
