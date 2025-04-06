const express = require("express");
const router = express.Router();

// Import the Controllers

// Course Controllers Import
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
  getFullCourseDetails,
  editCourse,
  getInstructorCourses,
  deleteCourse,
  searchCourse,
  markLectureAsComplete,
} = require("../controllers/Course");

// Categories Controllers Import
const {
  showAllCategories,
  createCategory,
  categoryPageDetails,
  addCourseToCategory,
} = require("../controllers/Category");

// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

// Sub-Sections Controllers Import
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require("../controllers/Subsection");

// Rating Controllers Import
const {
  createRating,
  getAverageRating,
  getAllRating,
} = require("../controllers/RatingAndReview");

const { isDemo } = require("../middlewares/demo");

const { updateCourseProgress } = require("../controllers/courseProgress");

// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can only be created by instructors
router.post("/createCourse", auth, isInstructor, createCourse);              // Create a new course

// Add a section to a course
router.post("/addSection", auth, isInstructor, createSection);              

// Update a section
router.post("/updateSection", auth, isInstructor, updateSection);            

// Delete a section
router.post("/deleteSection", auth, isInstructor, deleteSection);            

// Update a subsection
router.post("/updateSubSection", auth, isInstructor, updateSubSection);      

// Delete a subsection
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);      

// Add a subsection to a section
router.post("/addSubSection", auth, isInstructor, createSubSection);         

// Get all registered courses
router.get("/getAllCourses", getAllCourses);                                 

// Get details for a specific course
router.post("/getCourseDetails", getCourseDetails);                          

// Get full details for a specific course
router.post("/getFullCourseDetails", auth, getFullCourseDetails);            

// Edit course details
router.post("/editCourse", auth, isInstructor, editCourse);                  

// Get all courses under a specific instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses); 

// Delete a course
router.delete("/deleteCourse", deleteCourse);                                

// Search courses
router.post("/searchCourse", searchCourse);                                  

// Update course progress
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress); 

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************

// Create a new category (Admin only)
router.post("/createCategory", auth, isAdmin, createCategory);               

// Show all categories
router.get("/showAllCategories", showAllCategories);                        

// Get details for a category page
router.post("/getCategoryPageDetails", categoryPageDetails);                 

// Add a course to a category
router.post("/addCourseToCategory", auth, isInstructor, addCourseToCategory); 

// ********************************************************************************************************
//                                      Rating and Review routes
// ********************************************************************************************************

// Create a rating
router.post("/createRating", auth, isStudent, createRating);                 

// Get the average rating
router.get("/getAverageRating", getAverageRating);                           

// Get all reviews
router.get("/getReviews", getAllRating);                                     

module.exports = router;
