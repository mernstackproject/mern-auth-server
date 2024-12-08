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
    if (!emailRegex.test(email)) {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      return createErrorResponse(res, errorMessages.passWordHash);
    }
    const existBoth = await user.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile: phoneNumber }],
      $and: [{ isDeleted: false }],
    });
    if (existBoth) {
      return res.status(400).json({ message: "already exits", status: false });
    }
    const expiry = Date.now() + 2 * 60 * 1000;
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const newUser = await user.create({
      name,
      email: email.toLowerCase(),
      mobile: phoneNumber,
      password: hashedPassword,
      referralCode,
      otp: otp,
      role: "user",
      otpExpired: expiry,
    });

    return createSuccessResponse(res, successMessages.registrationSuccess);
  } catch (e) {
    console.error(e.message, "lkjk");
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};

// OTP Verification
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const userRecord = await user.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }

    // Check if OTP is expired
    if (Date.now() > userRecord.otpExpired) {
      return createErrorResponse(res, errorMessages.otpExpired);
    }

    // Check if OTP matches
    if (Number(userRecord.otp) !== Number(otp)) {
      return createErrorResponse(res, errorMessages.invalidOtp);
    }

    // Check if already verified
    if (userRecord.isVerified) {
      return createErrorResponse(res, errorMessages.verifiedUser);
    }

    // OTP is valid and verified
    userRecord.otp = null; // Clear OTP
    userRecord.otpExpired = null; // Clear OTP expiration
    userRecord.isVerified = true; // Mark as verified
    await userRecord.save();

    return createSuccessResponse(
      res,
      { user: userRecord },
      successMessages.otpVerified
    );
  } catch (e) {
    console.error(e?.message, "message");
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return createErrorResponse(res, errorMessages.emailError);
    }
    if (!password) {
      return createErrorResponse(res, errorMessages.passwordError);
    }
    let existingUser = await user.findOne({
      email: email.toLowerCase(),
      role: "user",
      isDeleted: false,
    })
    if (!existingUser) {
      existingUser = await user.findOne({
        email: email.toLowerCase(),
        role: "user",
        isDeleted: true,
      });

      if (existingUser) {
        return createErrorResponse(
          res,
          errorMessages.deleteUser
        );
      }

      return createErrorResponse(res, errorMessages.userNotFound);
    }

    // Check if user is verified
    if (!existingUser.isVerified) {
      return createErrorResponse(res, "Please verify your otp first");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return createErrorResponse(res, errorMessages.invalidCredentials);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Optionally, save token in cookies for "Remember Me"
    await user.updateOne({ _id: existingUser._id }, { $set: { token: token } });

    // Return success response
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
    const existingUser = await user.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!existingUser) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiry = Date.now() + 2 * 60 * 1000;
    existingUser.otp = otp;
    existingUser.otpExpired = otpExpiry;
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send reset URL via email
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Password Reset Request",
    //   text: `Click the link to reset your password: ${resetUrl}`,
    // };
    // await transporter.sendMail(mailOptions);
    await existingUser.save();
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

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const userRecord = await user.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    if (!userRecord.isResetPasswordVerified) {
      return createErrorResponse(res, "otp not verified");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (!hashedPassword) {
      return createErrorResponse(res, errorMessages.passWordHash);
    }
    userRecord.password = hashedPassword;
    userRecord.isResetPasswordVerified = false;
    await userRecord.save();

    return createSuccessResponse(res, {}, successMessages.passwordResetSuccess);
  } catch (e) {
    console.error(e);
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const userRecord = await user.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!userRecord) {
      return createErrorResponse(res, "User not found");
    }

    if (userRecord.isVerified) {
      return createErrorResponse(res, "User is already verified");
    }

    // Generate new OTP and set expiry
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes expiry

    userRecord.otp = otp;
    userRecord.otpExpired = otpExpiry;
    await userRecord.save();

    // Send OTP to user's email or phone (implement email/SMS sending logic)
    // await sendOtpEmailOrSms(userRecord.email, otp);

    return createSuccessResponse(res, "New OTP sent successfully");
  } catch (error) {
    console.error(error);
    return createErrorResponse(res, "Error resending OTP");
  }
};
exports.isResendPasswordVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userRecord = await user.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });
    if (!userRecord) {
      return createErrorResponse(res, errorMessages.userNotFound);
    }
    if (Date.now() > userRecord.otpExpired) {
      return createErrorResponse(res, errorMessages.otpExpired);
    }

    if (Number(userRecord.otp) !== Number(otp)) {
      return createErrorResponse(res, errorMessages.invalidOtp);
    }
    userRecord.otp = null;
    userRecord.otpExpired = null;
    userRecord.isResetPasswordVerified = true;
    await userRecord.save();

    return createSuccessResponse(
      res,
      { user: userRecord },
      successMessages.otpVerified
    );
  } catch (e) {
    cre
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
        expiresIn: "1h",
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
        // Check if the error is token expiration
        if (err instanceof jwt.TokenExpiredError) {
          return createSuccessResponse(res, {
            isValid: false,
            message: "Token has expired",
          });
        }
        return createSuccessResponse(res, {
          isValid: false,
          message: "Invalid token",
        });
      }
      return createSuccessResponse(res, { isValid: true });
    });
  } catch (e) {
    return createErrorResponse(res, errorMessages.internalServerError, 500);
  }
};
