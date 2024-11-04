const express = require("express");
const {getAdminProfile} = require("../controller/admin"); 
const {verifyToken,checkAdminRole} = require("../verifytoken");
const router = express.Router();
router.get("/profile", verifyToken ,checkAdminRole ,getAdminProfile);
module.exports = router; 
