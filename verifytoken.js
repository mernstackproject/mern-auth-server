const jwt = require("jsonwebtoken");
const {
  createErrorResponse
} = require("./helpers/responsehelper");
const {errorMessages} =  require("./helpers/messageConstants") 
exports.verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token not provided",
    });
  }
  token = token.replace(/^Bearer\s+/, "");
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
        });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to authenticate token",
        });
      }
    }
    req.loginUserId = decoded.userId;
    req.userRole = decoded.role;
    next();
  });
};

exports.checkAdminRole = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied:Admins only.",
    });
  }
  next();
};
