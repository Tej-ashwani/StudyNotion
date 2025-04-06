const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

/***************************************************************
 * Method: createSection
 * Description: Create a new section and add it to the specified course.
 ***************************************************************/
exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;

        // Validate required properties
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required properties.',
            });
        }

        // Create a new section
        const newSection = await Section.create({ sectionName });

        // Add the new section to the course's content array
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: { courseContent: newSection._id },
            },
            { new: true }
        )
        .populate({
            path: 'courseContent',
            populate: {
                path: 'subSection',
            },
        })
        .exec();

        // Return the updated course object in the response
        return res.status(200).json({
            success: true,
            message: 'Section created successfully.',
            updatedCourse,
        });
    } catch (error) {
        console.error("Error creating section:", error);
        return res.status(500).json({
            success: false,
            message: 'Unable to create section. Please try again.',
            error: error.message,
        });
    }
};

/***************************************************************
 * Method: updateSection
 * Description: Update the name of an existing section.
 ***************************************************************/
exports.updateSection = async (req, res) => {
    try {
        const { sectionName, sectionId, courseId } = req.body;

        // Validate required properties
        if (!sectionId || !sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required properties.',
            });
        }

        // Update the section
        const section = await Section.findByIdAndUpdate(
            sectionId,
            { sectionName },
            { new: true }
        );

        // Fetch the updated course with populated content
        const course = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                },
            })
            .exec();

        // Return the updated section and course details
        return res.status(200).json({
            success: true,
            message: 'Section updated successfully.',
            section,
            data: course,
        });
    } catch (error) {
        console.error("Error updating section:", error);
        return res.status(500).json({
            success: false,
            message: 'Unable to update section. Please try again.',
            error: error.message,
        });
    }
};

/***************************************************************
 * Method: deleteSection
 * Description: Delete a section and its associated sub-sections from the course.
 ***************************************************************/
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId, courseId } = req.body;

        // Remove the section from the course's content array
        await Course.findByIdAndUpdate(
            courseId,
            {
                $pull: { courseContent: sectionId },
            }
        );

        // Find and delete the section
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found.',
            });
        }

        // Delete associated sub-sections
        await SubSection.deleteMany({ _id: { $in: section.subSection } });

        // Delete the section
        await Section.findByIdAndDelete(sectionId);

        // Fetch the updated course and return the result
        const course = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                },
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: 'Section deleted successfully.',
            data: course,
        });
    } catch (error) {
        console.error("Error deleting section:", error);
        return res.status(500).json({
            success: false,
            message: 'Unable to delete section. Please try again.',
            error: error.message,
        });
    }
};
