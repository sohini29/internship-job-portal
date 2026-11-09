const jwt = require("jsonwebtoken");

function userAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.USER_JWT_SECRET
    );

    if (decoded.role !== "user" || !decoded.userId) {
      return res.status(403).json({
        message: "User access only.",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your login has expired. Please log in again.",
    });
  }
}

module.exports = userAuthMiddleware;