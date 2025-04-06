const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");

/***************************************************************
 * Function: capturePayment
 * Description: Capture the payment and initiate the Razorpay order.
 ***************************************************************/
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (!courses || courses.length === 0) {
    return res.json({ success: false, message: "Please provide course IDs" });
  }

  let total_amount = 0;

  for (const course_id of courses) {
    let course;
    try {
      // Find the course by its ID
      course = await Course.findById(course_id);

      // If the course is not found, return an error
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      // Check if the user is already enrolled in the course
      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({ success: false, message: "Student is already enrolled" });
      }

      // Add the price of the course to the total amount
      total_amount += course.price;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: crypto.randomBytes(16).toString("hex"), // Use crypto for a unique receipt ID
  };

  try {
    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options);
    res.json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not initiate order" });
  }
};

/***************************************************************
 * Function: verifyPayment
 * Description: Verify the payment using the Razorpay signature.
 ***************************************************************/
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res);
    return res.status(200).json({ success: true, message: "Payment verified" });
  }

  return res.status(400).json({ success: false, message: "Payment verification failed" });
};

/***************************************************************
 * Function: enrollStudents
 * Description: Enroll students in the courses and send email notifications.
 ***************************************************************/
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({ success: false, message: "Please provide course IDs and user ID" });
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({ success: false, message: "Course not found" });
      }

      // Create course progress entry for the student
      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );

      // Send an email notification to the enrolled student
      await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(enrolledCourse.courseName, enrolledStudent.firstName)
      );

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

/***************************************************************
 * Function: sendPaymentSuccessEmail
 * Description: Send an email notification for successful payment.
 ***************************************************************/
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({ success: false, message: "Please provide all required details" });
  }

  try {
    const enrolledStudent = await User.findById(userId);

    await mailSender(
      enrolledStudent.email,
      "Payment Received",
      paymentSuccessEmail(enrolledStudent.firstName, amount / 100, orderId, paymentId)
    );

    return res.status(200).json({ success: true, message: "Payment success email sent" });
  } catch (error) {
    console.error("Error in sending email:", error);
    return res.status(500).json({ success: false, message: "Could not send email" });
  }
};
