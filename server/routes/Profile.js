const express = require("express");
const router = express.Router();
const { auth, isInstructor } = require("../middlewares/auth");


const {
  deleteAccount,
  updateProfile,
  getAllUserDetails,
  updateDisplayPicture,
  getEnrolledCourses,
  instructorDashboard,
} = require("../controllers/Profile");
const { isDemo } = require("../middlewares/demo");




// Profile routes
router.delete("/deleteProfile", auth, deleteAccount);            // Delete user account
router.put("/updateProfile", auth, updateProfile);               // Update user profile
router.get("/getUserDetails", auth, getAllUserDetails);          // Get all user details
router.get("/getEnrolledCourses", auth, getEnrolledCourses);     // Get enrolled courses
router.put("/updateDisplayPicture", auth, updateDisplayPicture); // Update display picture
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard); // Instructor dashboard

module.exports = router;
