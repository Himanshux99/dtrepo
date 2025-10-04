const { onRequest } = require("firebase-functions/v2/https");
const { onCall } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

// Define secret keys in a secure way using the params module



const Razorpay = require("razorpay");
const functions = require("firebase-functions");

admin.initializeApp();

const razorpayKeyId = functions.config().razorpay.key_id;
const razorpayKeySecret = functions.config().razorpay.key_secret;

// --- v2 FUNCTION: Create a Razorpay Order ---

exports.createRazorpayOrder = onRequest({ cors: true }, async (request, response) => {
  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  try {
    const options = {
      amount: request.body.data.amount, // in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    response.status(200).send({ data: order });
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: "Failed to create order." });
  }
});


// --- v2 FUNCTION: Verify the Payment Signature ---
exports.verifyRazorpayPayment = onRequest({ cors: true }, (request, response) => {
  try {
    const { order_id, payment_id, signature } = request.body.data;
    const crypto = require("crypto");

    const body = order_id + "|" + payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret.value())
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === signature) {
      response.status(200).send({ data: { status: "success" } });
    } else {
      response.status(400).send({ error: "Payment verification failed." });
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    response.status(500).send({ error: "Verification failed." });
  }
});

// --- v2 FUNCTION: Send a Test Notification (using onCall) ---
exports.sendTestNotification = onCall({ cors: true }, async (request) => {
  const userToken = request.data.token;
  if (!userToken) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a user token.");
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
    throw new functions.https.HttpsError("internal", "Error sending notification.");
  }
});