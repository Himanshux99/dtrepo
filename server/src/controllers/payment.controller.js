import Razorpay from "razorpay";
import crypto from "crypto";
import { db, admin } from "../firebase/firebase.js"; // ensure admin is exported from firebase.js
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
 * Helper: resolve uid from req.user or Authorization Bearer token
 */
const resolveUid = async (req) => {
  if (req.user && req.user.uid) return req.user.uid;
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (err) {
    console.error("Failed to verify ID token:", err);
    return null;
  }
};

/**
 * @desc   Create Razorpay Order
 * @route  POST /api/payments/create-order
 * @access Private (Authenticated users)
 */
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    log("Create Order Request Amount:", amount);
    if (!amount || typeof amount !== "number" || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least 100 paise (₹1)",
      });
    }

    // resolve uid from req or Authorization header
    const uid = await resolveUid(req);
    log("Create Order Request UID:", uid);
    if (!uid) {
      return res.status(410).json({ success: false, message: "Unauthorized" });
    }
    log("Creating Razorpay order for UID:", uid, "Amount:", amount);
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: uid,
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

    // resolve uid (fallback to verifying ID token if req.user absent)
    const uid = await resolveUid(req);
    if (!uid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Store payment record
    await db.collection("payments").doc(payment_id).set({
      order_id,
      payment_id,
      userId: uid,
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
