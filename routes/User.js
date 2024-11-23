const express = require("express");
const { register, login,verifyOtp, OauthGoogleLogin,foundUser,validateToken,forgotPassword , resetPassword, isResendPasswordVerify, resendOtp} = require("../controller/User"); 
const {verifyToken} = require("../verifytoken");
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/OauthGoogleLogin", OauthGoogleLogin);
router.post("/verifyToken", verifyToken);
router.get("/found-user", verifyToken, foundUser); 
router.post("/validateToken",validateToken)
router.post("/forgot-password", forgotPassword)
router.post("/verifyOtp",verifyOtp)
router.post("/resend-otp", resendOtp)
router.post("/reset-password-verify", isResendPasswordVerify)
router.post("/reset-password", resetPassword)
module.exports = router;
