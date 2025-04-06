const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const mongoose = require("mongoose");

/***************************************************************
 * Method: createRating
 * Description: Create a rating and review for a course by an enrolled user.
 ***************************************************************/
exports.createRating = async (req, res) => {
    try {
        // Extract user ID and review data from request body
        const userId = req.user.id;
        const { rating, review, courseId } = req.body;

        // Check if the user is enrolled in the course
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $elemMatch: { $eq: userId } },
        });

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in the course',
            });
        }

        // Check if the user has already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: 'Course is already reviewed by the user',
            });
        }

        // Create a new rating and review
        const ratingReview = await RatingAndReview.create({
            rating,
            review,
            course: courseId,
            user: userId
        });

        // Update the course with the new rating/review ID
        await Course.findByIdAndUpdate(
            { _id: courseId },
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            { new: true }
        );

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Rating and Review created Successfully',
            ratingReview,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/***************************************************************
 * Method: getAverageRating
 * Description: Calculate and return the average rating for a course.
 ***************************************************************/
exports.getAverageRating = async (req, res) => {
    try {
        // Extract course ID from request body
        const courseId = req.body.courseId;

        // Calculate the average rating for the course
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                },
            }
        ]);

        // Return average rating if reviews exist
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        // Return default message if no ratings exist
        return res.status(200).json({
            success: true,
            message: 'Average Rating is 0, no ratings given till now',
            averageRating: 0,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/***************************************************************
 * Method: getAllRating
 * Description: Fetch all ratings and reviews, sorted by rating.
 ***************************************************************/
exports.getAllRating = async (req, res) => {
    try {
        // Fetch all ratings and reviews, sorted by rating in descending order
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();

        // Return success response with all reviews
        return res.status(200).json({
            success: true,
            message: 'All reviews fetched successfully',
            data: allReviews,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
