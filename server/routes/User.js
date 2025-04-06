// Import the required modules
const express = require("express");
const router = express.Router();

   // Import the required controllers and middleware functions
    const {
    login,
    signup,
    sendotp,
    changePassword,
    } = require("../controllers/Auth");
    const {
    resetPasswordToken,
    resetPassword,
    } = require("../controllers/ResetPassword");
    const { isDemo } = require("../middlewares/demo");
    const { auth } = require("../middlewares/auth");

    // Authentication routes
    router.post("/login", login);                // User login
    router.post("/signup", signup);              // User signup
    router.post("/sendotp", sendotp);            // Send OTP to user's email
    router.post("/changepassword", auth, changePassword); // Change user password (authenticated)

// Password reset routes
    router.post("/reset-password-token", resetPasswordToken); // Generate reset password token
    router.post("/reset-password", resetPassword);            // Reset user's password after verification

    // Export the router for use in the main application
    module.exports = router;
