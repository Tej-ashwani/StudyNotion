const Profile = require("../models/Profile");
const User = require("../models/User");

/***************************************************************
 * Method: updateProfile
 * Description: Update user profile details.
 ***************************************************************/
exports.updateProfile = async (req, res) => {
  try {
    const {
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;
    const id = req.user.id;

    // Validate required fields
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Find user and profile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);

    // Update profile fields
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    // Save the updated profile
    await profileDetails.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/***************************************************************
 * Method: deleteAccount
 * Description: Delete user account and associated data.
 ***************************************************************/
exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;

    // Find user
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated profile
    await Profile.findByIdAndDelete(userDetails.additionalDetails);

    // Remove user from courses
    for (const courseId of userDetails.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnrolled: id } },
        { new: true }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // Also delete course progress
    await CourseProgress.deleteMany({ userId: id });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User could not be deleted successfully",
    });
  }
};

/***************************************************************
 * Method: getAllUserDetails
 * Description: Fetch all details of the currently logged-in user.
 ***************************************************************/
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;

    // Find user and populate additional details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/***************************************************************
 * Method: updateDisplayPicture
 * Description: Update the user's display picture.
 ***************************************************************/
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;

    // Upload image to Cloudinary
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    // Update user's image URL
    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/***************************************************************
 * Method: getEnrolledCourses
 * Description: Fetch the courses enrolled by the user.
 ***************************************************************/
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and populate course details
    let userDetails = await User.findById(userId)
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();
    let SubsectionLength = 0;

    for (let i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;

      for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[j]
          .subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0);
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength += userDetails.courses[i].courseContent[j].subSection.length;
      }

      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      courseProgressCount = courseProgressCount?.completedVideos.length || 0;

      userDetails.courses[i].progressPercentage = SubsectionLength === 0
        ? 100
        : Math.round((courseProgressCount / SubsectionLength) * 100 * 100) / 100;
    }

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "Could not find user with the provided ID",
      });
    }

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/***************************************************************
 * Method: instructorDashboard
 * Description: Fetch course statistics for the instructor dashboard.
 ***************************************************************/
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      return {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
