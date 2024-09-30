  const express = require("express");
  const cors = require("cors");
  const connectDB = require("./config");
  const user = require("./routes/User");
  const Razorpay = require("razorpay");
  const dotenv = require("dotenv");
  dotenv.config();
  const razorPay = require("./models/Payment")
  const crypto =require("crypto")
  const PORT = process.env.PORT || 4000;
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://mern-auth-client-peach.vercel.app"); // Your frontend URL
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });

  connectDB();
  app.use(express.json());
  app.use("/api/v1", user);
  instance = new Razorpay({
    key_id:process.env.RAZOR_PAY_KEY_ID, 
    key_secret:process.env.RAZOR_PAY_KEY_SECRET, 
  });
  app.post("/api/v1/checkout", async (req, res) => {
    try {
      const options = {
        amount: Number(req.body.amount * 100),  // Converting to smallest unit (paise for INR)
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),  // Generating a random receipt ID
      };
  
      // Create order in Razorpay
      instance.orders.create(options, (error, order) => {
        if (order) {
          console.log("Order created:", order);
          res.status(200).json({
            success: true,
            order,
          });
        } else {
          console.log("Order creation failed:", error);
          res.status(500).json({ success: false, message: "Order creation failed" });
        }
      });
    } catch (e) {
      console.log("Error:", e.message);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
  // Payment verification route
  app.post("/api/v1/paymentverification", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
     console.log(req.body, "req.body")
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
  
    const isAuthentic = expectedSignature === razorpay_signature;
  
    if (isAuthentic) {
      console.log("Payment verified successfully");
        await razorPay.create({
          razorPay_signature_id:razorpay_order_id,
          razorPay_payment_id:razorpay_payment_id,
          razorPay_signature:razorpay_signature
        })  
        res.status(200).json({message:"Payment successful", status:true})
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  });
  app.get("/page", (req,res)=>{
    res.send("hello")
  })
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

