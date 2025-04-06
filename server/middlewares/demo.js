// Check if the user is a demo user
exports.isDemo = async (req, res, next) => {
    console.log(req.user.email);

    
    if (req.user.email === "newdemo1@gmail.com" || req.user.email === "newdemo2@gmail.com") {
        return res.status(401).json({
            success: false,
            message: "This is a Demo User",
        });
    }

    next();
};
