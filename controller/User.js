// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const user = require("../models/User");
// const razorPay = require("../models/Payment");
// const dotenv = require("dotenv");
const emailRegex = require("../regex");
// const {
//   createSuccessResponse,
//   createErrorResponse,
//   errorMessages,
//   successMessages,
// } = require("./AuthErrors");
// dotenv.config();
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     if (!name) {
//       return createErrorResponse(res, errorMessages.nameError);
//     }
//     if (!email) {
//       return createErrorResponse(res, errorMessages.emailError);
//     }
//     if (!password || password.length < 6) {
//       return createErrorResponse(res, errorMessages.passwordError);
//     }
//     const existingUser = await user.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return createErrorResponse(res, errorMessages.emailExist);
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await user.create({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role:role
//     });
//     return createSuccessResponse(
//       res,
//       { newUser },
//       successMessages.registrationSuccess
//     );
//   } catch (e) {
//     console.error(e);
//     return createErrorResponse(res, errorMessages.internalServerError, 500);
//   }
// };
// exports.login = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;
//     if (!email) {
//       return createErrorResponse(res, errorMessages.emailError);
//     }
//     if (!password) {
//       return createErrorResponse(res, errorMessages.passwordError);
//     }
//     const existingUser = await user.findOne({ email: email.toLowerCase() });
//     if (!existingUser) {
//       return createErrorResponse(res, errorMessages.userNotFound);
//     }
//     if (existingUser.role !== role) {
//       return createErrorResponse(res, errorMessages.invalidRole);
//     }
//     const isPasswordValid = await bcrypt.compare(
//       password,
//       existingUser.password
//     );
//     if (!isPasswordValid) {
//       return createErrorResponse(res, errorMessages.invalidCredentials);
//     }
//     const token = jwt.sign(
//       { userId: existingUser._id, role: existingUser.role },
//       process.env.SECRET_KEY,
//       { expiresIn: "30d" }
//     );

//     await user.updateOne(
//       { _id: existingUser._id },
//       { $set: { token: token } }
//     );
//     return createSuccessResponse(
//       res,
//       { user: existingUser, token },
//       successMessages.loginSuccess
//     );
//   } catch (e) {
//     console.error(e);
//     return createErrorResponse(res, errorMessages.internalServerError, 500);
//   }
// };
// exports.OauthGoogleLogin = async (req, res) => {
//   const { token } = req.body;
//   let decodeToken;
//   try {
//     decodeToken = jwt.decode(token);
//     if (!decodeToken || !decodeToken.email) {
//       return createErrorResponse(res, errorMessages.tokenValid, 400);
//     }
//   } catch (err) {
//     return createErrorResponse(res, errorMessages.tokenValid, 400);
//   }
//   try {
//     const { email } = decodeToken;
//     let userRecord = await user.findOne({ email });
//     if (!userRecord) {
//       userRecord = new user({
//         email: decodeToken.email,
//         authType: "google-login",
//         image: decodeToken.picture,
//       });
//       await userRecord.save();
//     }
//     const jwtToken = jwt.sign(
//       { userId: userRecord._id },
//       process.env.SECRET_KEY,
//       {
//         expiresIn: "30d",
//       }
//     );
//     await user.updateOne(
//       { _id: userRecord._id },
//       { $set: { token: jwtToken } }
//     );
//     return createSuccessResponse(
//       res,
//       { user: userRecord, token: jwtToken },
//       successMessages.OauthLogin
//     );
//   } catch (error) {
//     console.log(error,"error")
//     return createErrorResponse(res, errorMessages.GoogleLoginFailed, 500);
//   }
// };
// exports.foundUser = async (req, res) => {
//   const id = req.loginUserId;
//   try {
//     const userRecord = await user.findById(id);
//     if (!userRecord) {
//       return createErrorResponse(res, errorMessages.userNotFound);
//     }
//     return createSuccessResponse(
//       res,
//       { userRecord },
//       successMessages.userFound
//     );
//   } catch (e) {
//     return createErrorResponse(res, errorMessages.internalServerError, 500);
//   }
// };
// exports.validateToken = async (req, res) => {
//   try {
//     const token = req.headers['authorization']?.split(' ')[1];

//     if (!token) {
//       return createSuccessResponse(res, { isValid: false });
//     }
//     jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
//       if (err) {
//         return createSuccessResponse(res, { isValid: false });
//       }
//       return createSuccessResponse(res, { isValid: true });
//     });

//   } catch (e) {
//     console.error('Token validation error:', e);
//     return createErrorResponse(res, errorMessages.internalServerError, 500);
//   }
// };
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const user = require("../models/User");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const otpGenerator = require("otp-generator");
// If required for payment integration
dotenv.config();

const {
  createSuccessResponse,
  createErrorResponse,
} = require("../helpers/responsehelper");
const {
  errorMessages,
  successMessages,
} = require("../helpers/messageConstants");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Use your email
    pass: process.env.EMAIL_PASS, // Use your app password
  },
});

// Generate OTP
const generateOtp = () => {
  return otpGenerator.generate(6, {
    digits: true,
    upperCase: false,
    specialChars: false,
  });
};

// Send OTP to email
const sendOtpEmail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };
  return transporter.sendMail(mailOptions);
};

// Registration with OTP verification
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      confirmPassword,
      referralCode,
    } = req.body;
    if (!name) {
      return createErrorResponse(res, errorMessages.nameError);
    }
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (emailRegex.test(email)) {
      return createErrorResponse(res, errorMessages.emailRegexError);
    }
    if (!password) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    if (!confirmPassword) {
      return createErrorResponse(res, errorMessages.confirmPassword);
    }
    if (password !== confirmPassword) {
      return createErrorResponse(res, errorMessages.passwordMismatch);
    }

    const existingUser = await user.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return createErrorResponse(res, errorMessages.emailExist);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      return createErrorResponse(res, errorMessages.passWordHash);
    }
    const otp = generateOtp();
    const newUser = await user.create({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      referralCode,
      otp: otp, // Store OTP temporarily
    });

    // Send OTP to user's email
    await sendOtpEmail(email, otp);

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

// OTP Verification
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const userRecord = await user.findOne({ email: email.toLowerCase() });
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    if (userRecord.otp !== otp) {
      return createErrorResponse(res, errorMessages.invalidOtp);
    }

    // OTP verified, clear the OTP from database
    userRecord.otp = null;
    await userRecord.save();

    return createSuccessResponse(
      res,
      { user: userRecord },
      successMessages.otpVerified
    );
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (!password) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    const existingUser = await user.findOne({
      email: email.toLowerCase(),
      role: "user",
    });
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
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    await user.updateOne({ _id: existingUser._id }, { $set: { token: token } });

    // Optionally, save token in cookies for "Remember Me"
    if (rememberMe) {
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }); // 30 days
    }

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

// Forgot Password (send reset link)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await user.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }

    const resetToken = jwt.sign(
      { userId: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send reset URL via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetUrl}`,
    };
    await transporter.sendMail(mailOptions);

    return createSuccessResponse(
      res,
      {},
      successMessages.resetPasswordEmailSent
    );
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};

// Reset Password (after clicking on the reset link)
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userRecord = await user.findById(decoded.userId);
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userRecord.password = hashedPassword;
    await userRecord.save();

    return createSuccessResponse(res, {}, successMessages.passwordResetSuccess);
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.invalidToken, 400);
  }
};
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required", status: false });
  }
  try {
    const userRecord = await user.findOne({ email });
    if (!userRecord) {
      return res.status(400).json({ message: "User not found", status: false });
    }
    if (userRecord.isVerified) {
      return res
        .status(200)
        .json({ message: "User already verified", status: true });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000);
    userRecord.mobileOtp = newOtp;
    await userRecord.save();

    return res.status(200).json({
      message: "OTP resent successfully",
      status: true,
      newOtp: newOtp,
    });
  } catch (e) {
    console.error("Error in resending OTP:", e);
    return res
      .status(500)
      .json({ message: "Internal server error", status: false });
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
    console.log(error, "error");
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
    const token = req.headers["authorization"]?.split(" ")[1];
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
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
