// Import the function to format the email content and the mailSender utility
const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

// Controller function to handle contact form submissions
exports.contactUsController = async (req, res) => {
  // Destructure fields from the request body
  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body;
  
  // Log the request body for debugging purposes
  console.log(req.body);
  
  try {
    // Send an email using the mailSender function
    // Parameters:
    // 1. recipient email address
    // 2. subject line of the email
    // 3. email body formatted using contactUsEmail function
    const emailRes = await mailSender(
      email,
      "Your Data sent successfully",
      contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
    );

    // Log the response from the mailSender function
    console.log("Email Res ", emailRes);
    
    // Send a JSON response to the client indicating success
    return res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.log("Error", error);
    console.log("Error message :", error.message);
    
    // Send a JSON response to the client indicating failure
    return res.json({
      success: false,
      message: "Something went wrong...",
    });
  }
};
