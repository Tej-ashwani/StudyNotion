// Import necessary modules
const mongoose = require("mongoose");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");

// Update course progress for a user
exports.updateCourseProgress = async (req, res) => {
  // Extract course ID and subsection ID from the request body
  const { courseId, subsectionId } = req.body;
  // Get the user ID from the request object (assumed to be set by authentication middleware)
  const userId = req.user.id;

  try {
    // Check if the subsection exists
    const subsection = await SubSection.findById(subsectionId);
    if (!subsection) {
      return res.status(404).json({
        error: "Invalid subsection",
      });
    }

    // Find the course progress document for the user and course
    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    if (!courseProgress) {
      // If course progress document doesn't exist, return an error response
      return res.status(404).json({
        success: false,
        message: "Course progress does not exist",
      });
    } else {
      // If course progress document exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subsectionId)) {
        return res.status(400).json({
          error: "Subsection already completed",
        });
      }

      // Add the subsection ID to the completedVideos array
      courseProgress.completedVideos.push(subsectionId);
    }

    // Save the updated course progress document
    await courseProgress.save();

    // Return a success response
    return res.status(200).json({
      message: "Course progress updated",
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
