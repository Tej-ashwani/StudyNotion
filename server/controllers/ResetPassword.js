const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/***************************************************************
 * Method: resetPasswordToken
 * Description: Generate and send a password reset token to the user's email.
 ***************************************************************/
exports.resetPasswordToken = async (req, res) => {
    try {
        const email = req.body.email;

        // Check if the user with the given email exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: `This Email: ${email} is not registered with us. Enter a valid email.`,
            });
        }

        // Generate a random token
        const token = crypto.randomBytes(20).toString("hex");

        // Update the user with the reset token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000, // Token valid for 1 hour
            },
            { new: true }
        );
        console.log("DETAILS", updatedDetails);

        // Create the password reset URL
        const url = `http://localhost:3000/update-password/${token}`;

        // Send the reset link to the user's email
        await mailSender(
            email,
            "Password Reset",
            `Your link for password reset is ${url}. Please click this URL to reset your password.`
        );

        return res.json({
            success: true,
            message: 'Email sent successfully. Please check your email to continue.',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Some error occurred while sending the reset password email.',
        });
    }
};

/***************************************************************
 * Method: resetPassword
 * Description: Reset the user's password using the provided token.
 ***************************************************************/
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        // Validate password and confirm password match
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: 'Password and Confirm Password do not match.',
            });
        }

        // Find the user with the given token
        const userDetails = await User.findOne({ token: token });
        if (!userDetails) {
            return res.json({
                success: false,
                message: 'Token is invalid.',
            });
        }

        // Check if the token has expired
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: 'Token has expired. Please regenerate your token.',
            });
        }

        // Encrypt the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user with the new password
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword, token: null }, // Optionally clear the token
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Password reset successful.',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Some error occurred while updating the password.',
        });
    }
};
