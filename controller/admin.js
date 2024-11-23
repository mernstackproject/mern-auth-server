const user = require("../models/User");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../helpers/responsehelper");
const {
  errorMessages,
  successMessages,
} = require("../helpers/messageConstants");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
exports.getAdminProfile = async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return createErrorResponse(res, errorMessages.adminAccess);
    }
    const adminData = await user.findById(req.loginUserId).select("-password");
    if (!adminData) {
      return createErrorResponse(res, errorMessages.adminNotFound);
    }

    return createSuccessResponse(
      res,
      { adminData },
      successMessages.adminProfileFound
    );
  } catch (error) {
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};

exports.AdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (!password) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    const existingUser = await user
      .findOne({
        email: email.toLowerCase(),
        role: "admin",
      })
      .select("-__v");
    if (!existingUser) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return createErrorResponse(res, errorMessages.invalidCredentials);
    }
    const token = jwt.sign(
      { userId: existingUser._id, role: existingUser.role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    await user.updateOne({ _id: existingUser._id }, { $set: { token: token } });

    return createSuccessResponse(
      res,
      { user: existingUser },
      successMessages.loginSuccess
    );
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
