// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const Razorpay= require("razorpay");
const dotenv = require("dotenv");
const crypto= require("crypto");


dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
router.post("/create-order", async (req, res) => {
  const { amount,  } = req.body;

  const options = {
    amount: amount * 100, // Razorpay works in paise
    currency: "INR",
    receipt: "receipt_order_" + Math.random().toString(36).substring(7), // Unique receipt ID
  };

  try {
    const order = await razorpay.orders.create(options,(err, order) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Payment Signature
router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing fields in body" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature === razorpay_signature) {
    return res.status(200).json({ success: true, message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

module.exports = router;
