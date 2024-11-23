const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require:true
    },
    email: {
      type: String,
      require:true
    },
    password: {
      type: String,
      require:true
    },
    googlId:{
      type:String
    },
    image:{
      type:String
    },
    address:{
      type:String
    },
    authType:{
      type:String
    },
    mobile:{
      type:String
    },
    token:{
      type:String
    },
  
    isVerified:{
      type:Boolean,
      default:false
    },
    isResetPasswordVerified:{
      type:Boolean,
      default:false
    },
    otp:{
   type:Number
    },
    otpExpired:{
        type:Date,
       
    },
    role: { type: String, enum: ["user", "admin", "superAdmin"], required: true },

  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("User", userSchema);
