
const express = require("express");
const router = express.Router();

const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payments");
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");


// Payment routes
router.post("/capturePayment", auth, isStudent, capturePayment);                 // Capture payment
router.post("/verifyPayment", auth, isStudent, verifyPayment);                   // Verify payment
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail); // Send payment success email

module.exports = router;
