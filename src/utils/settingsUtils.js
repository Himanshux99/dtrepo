import { auth } from '../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';

// --- Firebase Password Reset ---
export const handlePasswordReset = async (email) => {
  try {
    if (!email) {
      toast.error("User email not found for reset.");
      return;
    }
    // This function sends a password reset link to the user's email
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset link sent to your registered email!');
  } catch (error) {
    console.error("Password reset error: ", error);
    // Notify user if the email is invalid or Firebase returns an error
    toast.error(error.message || 'Failed to send reset link. Please check your email address.');
  }
};