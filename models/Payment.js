const mongoose = require("mongoose")
const payMentSchema = new mongoose.Schema({
  razorPay_order_id:{
    type:String,
    require:true
  },
  razorPay_payment_id:{
    type:String,
    require:true
  },
  razorPay_signature:{
    type:String,
    require:true 
  },
  date:{
    type:Date,
    default:Date.now
  }
  
})
module.exports = mongoose.model("razorpay", payMentSchema)