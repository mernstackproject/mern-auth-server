const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../models/User");
const razorPay = require("../models/Payment");
const dotenv = require("dotenv");

const {
  createSuccessResponse,
  createErrorResponse,
  errorMessages,
  successMessages,
} = require("./AuthErrors");
dotenv.config();
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name) {
      return createErrorResponse(res, errorMessages.nameError);
    }
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (!password || password.length < 6) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    const existingUser = await user.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse(res, errorMessages.emailExist);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await user.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    return createSuccessResponse(
      res,
      { newUser },
      successMessages.registrationSuccess
    );
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (!password) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    const existingUser = await user.findOne({ email: email.toLowerCase() });
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
      { userId: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );

    await user.updateOne(
      { _id: existingUser._id },
      { $set: { token: token } } 
    );
    return createSuccessResponse(
      res,
      { user: existingUser, token },
      successMessages.loginSuccess
    );
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
exports.OauthGoogleLogin = async (req, res) => {
  const { token } = req.body;
  let decodeToken;
  try {
    decodeToken = jwt.decode(token);
    if (!decodeToken || !decodeToken.email) {
      return createErrorResponse(res, errorMessages.tokenValid, 400);
    }
  } catch (err) {
    return createErrorResponse(res, errorMessages.tokenValid, 400);
  }
  try {
    const { email } = decodeToken;
    let userRecord = await user.findOne({ email });
    if (!userRecord) {
      userRecord = new user({
        email: decodeToken.email,
        authType: "google-login",
        image: decodeToken.picture,
      });
      await userRecord.save();
    }
    const jwtToken = jwt.sign(
      { userId: userRecord._id },
      process.env.SECRET_KEY,
      {
        expiresIn: "30d",
      }
    );
    await user.updateOne(
      { _id: userRecord._id },
      { $set: { token: jwtToken } }
    );
    return createSuccessResponse(
      res,
      { user: userRecord, token: jwtToken },
      successMessages.OauthLogin
    );
  } catch (error) {
    console.log(error,"error")
    return createErrorResponse(res, errorMessages.GoogleLoginFailed, 500);
  }
};
exports.foundUser = async (req, res) => {
  const id = req.loginUserId;
  try {
    const userRecord = await user.findById(id);
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    return createSuccessResponse(
      res,
      { userRecord },
      successMessages.userFound
    );
  } catch (e) {
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
exports.validateToken = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return createSuccessResponse(res, { isValid: false });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        return createSuccessResponse(res, { isValid: false });
      }
      return createSuccessResponse(res, { isValid: true });
    });

  } catch (e) {
    console.error('Token validation error:', e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};