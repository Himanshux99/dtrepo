const { onRequest } = require("firebase-functions/v1/https");
const { onCall } = require("firebase-functions/v1/https");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors")({ origin: true }); // ✅ Use cors for v1

admin.initializeApp();

// Define secret keys in a secure way using the params module
const razorpayKeyId = defineString("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineString("RAZORPAY_KEY_SECRET");

// --- Create a Razorpay Order ---
exports.createRazorpayOrder = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const amount = req.body.data.amount;

      const razorpay = new Razorpay({
        key_id: razorpayKeyId.value(),
        key_secret: razorpayKeySecret.value(),
      });

      const options = {
        amount: amount,
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`,
      };

      const order = await razorpay.orders.create(options);
      res.status(200).send({ data: order });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      res.status(500).send({ error: "Failed to create order." });
    }
  });
});

// --- Verify the Payment Signature ---
exports.verifyRazorpayPayment = onRequest((req, res) => {
  cors(req, res, () => {
    try {
      const { order_id, payment_id, signature } = req.body.data;
      const crypto = require("crypto");

      const body = order_id + "|" + payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret.value())
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === signature) {
        res.status(200).send({ data: { status: "success" } });
      } else {
        res.status(400).send({ error: "Payment verification failed." });
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      res.status(500).send({ error: "Verification failed." });
    }
  });
});

// --- Send a Test Notification ---
exports.sendTestNotification = onCall(async (request) => {
  const userToken = request.data.token;
  if (!userToken) {
    const functions = require("firebase-functions");
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a user token."
    );
  }

  const payload = {
    notification: {
      title: "🧪 Test Notification!",
      body: "If you received this, your setup is working correctly.",
    },
  };

  try {
    await admin.messaging().sendToDevice(userToken, payload);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    const functions = require("firebase-functions");
    throw new functions.https.HttpsError("internal", "Error sending notification.");
  }
});
