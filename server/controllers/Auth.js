    const bcrypt = require("bcryptjs");
    const User = require("../models/User");
    const OTP = require("../models/OTP");
    const jwt = require("jsonwebtoken");
    const otpGenerator = require("otp-generator");
    const mailSender = require("../utils/mailSender");
    const { passwordUpdated } = require("../mail/templates/passwordUpdate");
    const Profile = require("../models/Profile");
    require("dotenv").config();




// Controller for User Signup
exports.signup = async (req, res) => {
	try {
		// Destructure fields from the request body
		const {
			firstName,
			lastName,
			email,
			password,
			confirmPassword,
			accountType,
			contactNumber,
			otp,
		} = req.body;




		// Check if all required fields are provided
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!confirmPassword ||
			!otp
		) {
			return res.status(403).json({
				success: false,
				message: "All fields are required",
			});
		}

		// Check if password and confirm password match
		if (password !== confirmPassword) {
			return res.status(400).json({
				success: false,
				message: "Password and Confirm Password do not match. Please try again.",
			});
		}

		// Check if the user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists. Please sign in to continue.",
			});
		}

		// Find the most recent OTP for the email
		const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
		if (recentOtp.length === 0) {
			return res.status(400).json({
				success: false,
				message: "OTP not found",
			});
		}

		// Check if the provided OTP is valid
		if (otp !== recentOtp[0].otp) {
			return res.status(400).json({
				success: false,
				message: "Invalid OTP",
			});
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user profile
		const profileDetails = await Profile.create({
			gender: null,
			dateOfBirth: null,
			about: null,
			contactNumber: null,
		});

		// Create the user
		const user = await User.create({
			firstName,
			lastName,
			email,
			contactNumber,
			password: hashedPassword,
			accountType,
			additionalDetails: profileDetails._id,
			image: `https://api.dicebear.com/6.x/initials/svg?seed=${firstName} ${lastName}&backgroundColor=00897b,00acc1,039be5,1e88e5,3949ab,43a047,5e35b1,7cb342,8e24aa,c0ca33,d81b60,e53935,f4511e,fb8c00,fdd835,ffb300,ffd5dc,ffdfbf,c0aede,d1d4f9,b6e3f4&backgroundType=solid,gradientLinear&backgroundRotation=0,360,-350,-340,-330,-320&fontFamily=Arial&fontWeight=600`,
		});

		return res.status(200).json({
			success: true,
			user,
			message: "User registered successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "User cannot be registered. Please try again.",
		});
	}
};




// Controller for User Login
exports.login = async (req, res) => {
	try {
		// Get email and password from request body
		const { email, password } = req.body;

		// Check if email or password is missing
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Please fill up all the required fields",
			});
		}

		// Find user with provided email
		const user = await User.findOne({ email }).populate("additionalDetails");

		// If user not found with provided email
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User is not registered. Please sign up to continue.",
			});
		}

		// Compare provided password with hashed password
		if (await bcrypt.compare(password, user.password)) {
			const token = jwt.sign(
				{ email: user.email, id: user._id, accountType: user.accountType },
				process.env.JWT_SECRET,
				{ expiresIn: "24h" }
			);

			// Save token to user document
			user.token = token;
			user.password = undefined;

			// Set cookie for token and return success response
			const options = {
				expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
				httpOnly: true,
			};

			res.cookie("token", token, options).status(200).json({
				success: true,
				token,
				user,
				message: "User login successful",
			});
		} else {
			return res.status(401).json({
				success: false,
				message: "Password is incorrect",
			});
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Login failure. Please try again",
		});
	}
};




// Controller for Sending OTP
exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if user already exists
		const checkUserPresent = await User.findOne({ email });
		if (checkUserPresent) {
			return res.status(401).json({
				success: false,
				message: "User is already registered",
			});
		}

		// Generate OTP
		let otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});

		// Ensure OTP is unique
		let result = await OTP.findOne({ otp: otp });
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
				lowerCaseAlphabets: false,
				specialChars: false,
			});
			result = await OTP.findOne({ otp: otp });
		}

		// Save OTP to database
		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);

		return res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			otp,
		});
	} catch (error) {
		console.error(error.message);
		return res.status(500).json({ success: false, error: error.message });
	}
};





// Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		// Get user details from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
		if (!isPasswordMatch) {
			return res.status(401).json({
				success: false,
				message: "The old password is incorrect",
			});
		}

		// Hash the new password and update user details
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				"Password for your account has been updated",
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		return res.status(200).json({
			success: true,
			message: "Password updated successfully",
		});

	} 
  
  catch (error) {
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
	}
};
