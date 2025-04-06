const jwt = require("jsonwebtoken");       // Importing the jsonwebtoken module
require("dotenv").config();                // Load environment variables from .env file
const User = require("../models/User");    // Importing the User model

// Middleware function to authenticate user requests
exports.auth = async (req, res, next) => {
    try {
        // Extracting JWT from request cookies, body, or header
        const token =
            req.cookies.token ||
            req.body.token ||
            req.header("Authorization")?.replace("Bearer ", "");

        // If no token is provided, respond with 401 Unauthorized
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is missing',
            });
        }

        try {
            // Verify the JWT using the secret key from environment variables
            const decode = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the decoded token payload to the request object
            req.user = decode;
        } catch (error) {
            // If JWT verification fails, respond with 401 Unauthorized
            return res.status(401).json({
                success: false,
                message: 'Token is invalid',
            });
        }

        // Proceed to the next middleware or request handler
        next();
    } catch (error) {
        // Handle any other errors during the authentication process
        return res.status(401).json({
            success: false,
            message: 'Something went wrong while validating the token',
        });
    }
};

// Middleware function to check if the user is a Student
exports.isStudent = async (req, res, next) => {
    try {
        // Check if the user's account type is 'Student'
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Students only',
            });
        }

        // Proceed to the next middleware or request handler
        next();
    } catch (error) {
        // Handle any errors related to user role verification
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again',
        });
    }
};

// Middleware function to check if the user is an Instructor
exports.isInstructor = async (req, res, next) => {
    try {
        // Check if the user's account type is 'Instructor'
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Instructors only',
            });
        }

        // Proceed to the next middleware or request handler
        next();
    } catch (error) {
        // Handle any errors related to user role verification
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again',
        });
    }
};

// Middleware function to check if the user is an Admin
exports.isAdmin = async (req, res, next) => {
    try {
        // Check if the user's account type is 'Admin'
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for Admins only',
            });
        }

        // Proceed to the next middleware or request handler
        next();
    } catch (error) {
        // Handle any errors related to user role verification
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, please try again',
        });
    }
};
