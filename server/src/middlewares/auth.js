// const { admin } = require("../firebase");
import { admin } from "../firebase/firebase";

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID Token sent from frontend
 *
 * Header format:
 * Authorization: Bearer <FIREBASE_ID_TOKEN>
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "user", // if you add custom claims later
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default auth;
