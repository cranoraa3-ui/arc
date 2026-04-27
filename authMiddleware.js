const jwt = require("jsonwebtoken");

/**
 * Verify JWT token from Authorization header
 * Expected format: Bearer <token>
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: "No token provided. Authorization header required." 
    });
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ 
      success: false,
      message: "Invalid authorization header format. Expected: Bearer <token>" 
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store user info in request
    req.user = decoded;
    next();

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token expired. Please login again." 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Invalid or malformed token." 
    });
  }
}

module.exports = verifyToken;
