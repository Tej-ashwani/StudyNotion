const SubSection = require("../models/SubSection");
const Section = require("../models/Section");

const{uploadImageToCloudinary}= require("../utils/imageUploader");



 



require("dotenv").config();

/***************************************************************
 * Method: createSubSection
 * Description: Create a new sub-section and add it to a specified section.
 ***************************************************************/
exports.createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description } = req.body;
        const video = req.files.videoFile; // Use videoFile as per your provided code

        // Validate input fields
        if (!sectionId || !title || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        // Upload the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME
        );

        // Create a new sub-section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`, // Ensure consistency with the correct code
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        // Add the new sub-section to the specified section
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: { subSection: subSectionDetails._id },
            },
            { new: true }
        ).populate("subSection");

        // Return the updated section in the response
        return res.status(200).json({
            success: true,
            message: "Sub-section created successfully.",
            updatedSection,
        });
    } catch (error) {
        console.error("Error creating new sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

/***************************************************************
 * Method: updateSubSection
 * Description: Update an existing sub-section and reflect changes in the corresponding section.
 ***************************************************************/
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body;
        const subSection = await SubSection.findById(subSectionId);

        // Check if sub-section exists
        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Sub-section not found.",
            });
        }

        // Update sub-section details
        if (title !== undefined) {
            subSection.title = title;
        }

        if (description !== undefined) {
            subSection.description = description;
        }

        // Update video if provided
        if (req.files && req.files.videoFile) {
            const video = req.files.videoFile;
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            );
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }

        await subSection.save();

        // Find and return the updated section
        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.json({
            success: true,
            message: "Sub-section updated successfully.",
            data: updatedSection,
        });
    } catch (error) {
        console.error("Error updating sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the sub-section.",
            error: error.message,
        });
    }
};

/***************************************************************
 * Method: deleteSubSection
 * Description: Delete a sub-section and remove it from the specified section.
 ***************************************************************/
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body;

        // Remove the sub-section from the section's subSection array
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: { subSection: subSectionId },
            }
        );

        // Delete the sub-section
        const subSection = await SubSection.findByIdAndDelete(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Sub-section not found.",
            });
        }

        // Find and return the updated section
        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.json({
            success: true,
            message: "Sub-section deleted successfully.",
            data: updatedSection,
        });
    } catch (error) {
        console.error("Error deleting sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the sub-section.",
            error: error.message,
        });
    }
};
