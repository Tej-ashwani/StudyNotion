const { Mongoose } = require("mongoose");
const Category = require("../models/Category");
const Course = require("../models/Course"); // Added import for Course model

/**
 * Utility function to generate a random integer up to the specified maximum
 * @param {number} max - The upper limit for the random integer
 * @returns {number} - A random integer between 0 and max
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/* =============================================================================
   CREATE CATEGORY CONTROLLER
   ============================================================================= */

/**
 * Controller to create a new category
 */
exports.createCategory = async (req, res) => {
    try {
        // Destructure fields from the request body
        const { name, description } = req.body;

        // Validate that name is provided
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // Create a new category
        const categoryDetails = await Category.create({
            name,
            description,
        });

        console.log(categoryDetails);

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* =============================================================================
   SHOW ALL CATEGORIES CONTROLLER
   ============================================================================= */

/**
 * Controller to retrieve all categories
 */
exports.showAllCategories = async (req, res) => {
    try {
        console.log("INSIDE SHOW ALL CATEGORIES");

        // Fetch all categories from the database
        const allCategories = await Category.find({});

        res.status(200).json({
            success: true,
            data: allCategories,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/* =============================================================================
   CATEGORY PAGE DETAILS CONTROLLER
   ============================================================================= */

/**
 * Controller to retrieve details of a specific category, including courses
 */
exports.categoryPageDetails = async (req, res) => {
    try {
        // Extract categoryId from request body
        const { categoryId } = req.body;
        console.log("PRINTING CATEGORY ID: ", categoryId);

        // Fetch the selected category with published courses
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec();

        // Handle case when category is not found
        if (!selectedCategory) {
            console.log("Category not found.");
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Handle case when no courses are found for the category
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.");
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            });
        }

        // Get courses for other categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        });

        // Fetch a random different category
        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
                ._id
        )
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec();

        // Fetch top-selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec();

        // Flatten courses array and sort by sales
        const allCourses = allCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/* =============================================================================
   ADD COURSE TO CATEGORY CONTROLLER
   ============================================================================= */

/**
 * Controller to add a course to a category
 */
exports.addCourseToCategory = async (req, res) => {
    const { courseId, categoryId } = req.body;

    try {
        // Find the category by ID
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Find the course by ID
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Check if the course is already in the category
        if (category.courses.includes(courseId)) {
            return res.status(200).json({
                success: true,
                message: "Course already exists in the category",
            });
        }

        // Add the course to the category
        category.courses.push(courseId);
        await category.save();

        return res.status(200).json({
            success: true,
            message: "Course added to category successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
