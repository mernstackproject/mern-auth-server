const express = require("express");
const {getAdminProfile,AdminLogin} = require("../controller/admin"); 
const {verifyToken,checkAdminRole} = require("../verifytoken");
const router = express.Router();
router.get("/profile", verifyToken ,checkAdminRole ,getAdminProfile);
router.post("/admin-login", AdminLogin)
module.exports = router; 
