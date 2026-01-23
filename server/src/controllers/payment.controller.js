import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../firebase/firebase.js"; // adjust path if your firebase entry file differs
import { log } from "console";

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });


/**
 * Initialize Razorpay
 */
// log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc   Create Razorpay Order
 * @route  POST /api/payments/create-order
 * @access Private (Authenticated users)
 */
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least 100 paise (₹1)",
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.uid,
      },
    });

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

/**
 * @desc   Verify Razorpay Payment
 * @route  POST /api/payments/verify-payment
 * @access Private (Authenticated users)
 */
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    // Signature verification
    const body = `${order_id}|${payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(403).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Store payment record
    await db.collection("payments").doc(payment_id).set({
      order_id,
      payment_id,
      userId: req.user.uid,
      verified: true,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment_id,
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
