  const express = require("express");
  const cors = require("cors");
  const connectDB = require("./config");
  const user = require("./routes/User");
  const admin  = require("./routes/admin")
  const Razorpay = require("razorpay");
  const dotenv = require("dotenv");
  dotenv.config();
  const razorPay = require("./models/Payment")
  const crypto =require("crypto")
  const PORT = process.env.PORT || 4000;
  const app = express();
  const { Worker } = require('worker_threads');

  app.use(function (req, res, next) {
    // Allowed origins list
    const allowedOrigins = [
        'http://localhost:3000', 
        'https://mern-auth-client-peach.vercel.app'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Headers", 
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
        "Access-Control-Allow-Methods", 
        "GET, POST, PUT, DELETE, UPDATE"
    );
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Preflight response
    }

    next();
});

 app.get("/",(req,res)=>{
  res.send({message:"hello shya xvxm"})
 })
  connectDB();
  app.use(express.json());
  app.use("/api/v1", user);
  app.use("/api/v1",admin)
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

  app.get("/heavy", (req, res) => {
    const worker = new Worker("./worker.js"); // Worker create karna
    console.log(worker)
    worker.on("message", (data) => {
        console.log("///.." ,data);
        res.status(200).json(data ); // Worker se message receive karna
    });

    worker.on("error", (err) => {
      console.log("..,,..,.", err)
        res.status(500).json({ error: err.message }); // Error handling
    });

    worker.on("exit", (code) => {
      console.log(",,,", code)
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
            res.status(500).json({ error: "Worker stopped with exit code " + code });
        }
    });
});

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }); 