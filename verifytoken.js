const jwt = require("jsonwebtoken");
const {
  createErrorResponse,
  errorMessages,
} = require("./controller/AuthErrors");
exports.verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];
  token = token.replace(/^Bearer\s+/, "");
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        createErrorResponse(res, errorMessages.tokenValid);
      }
     req.loginUserId = decoded.userId;
      next();
    });
  } else {
    return res.json({
      success: false,
      message: "Token not provided",
    });
  }
};
