const express = require("express");
const { register, login, OauthGoogleLogin,foundUser,} = require("../controller/User"); 
const {verifyToken} = require("../verifytoken");
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/OauthGoogleLogin", OauthGoogleLogin);
router.post("/verifyToken", verifyToken);
router.get("/found-user",verifyToken,foundUser );

module.exports = router; 
