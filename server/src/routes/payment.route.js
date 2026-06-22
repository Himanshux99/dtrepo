import express from "express";
import {createOrder,verifyPayment} from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
// const auth = require("../middleware/auth");
// const razorpayController = require("../controllers/razorpay.controller");

router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);

export default router;
