const jwt = require("jsonwebtoken");

const checkLogin = (requiredRole) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "secret"
            );

            req.user = decoded;

            // Check if the user's role matches the required role
            if (requiredRole && decoded.role !== requiredRole) {
                console.log("here")
                return res
                    .status(403)
                    .json({ message: "Forbidden: Access denied" });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Auth Failed" });
        }
    };
};

module.exports = checkLogin;
