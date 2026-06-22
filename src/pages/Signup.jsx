import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Signup.module.css";
import toast, { Toaster } from "react-hot-toast";

function Signup() {
  // 1. Unified state for all form fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // 2. Single handler for all inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Corrected validation logic
  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[a-z]+\.[a-z]+(\d*)?@vit\.edu\.in$/;
    // Allows 2 digits, then 101/102/104/108, then one letter, then 4 digits.
    const rollNumberRegex = /^\d{2}(101|102|104|108)([A-Z]|[a-z])\d{4}$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please use a valid VIT email address.";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      // 4. Use email and password from the unified state
      await signup(formData.email, formData.password);
      setSignupSuccess(true);
      toast.success("Account created! Please check your email to verify.", 1000);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please log in.");
      } else {
        toast.error(error.message || "Failed to create an account.");
      }
    }
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="flex flex-cols justify-center items-center h-screen w-screen p-4">
        <div className={"card text-secondary text-center font-semibold"}>
          <h1 className="text-2xl font-bold border-b-2 border-secondary pb-2 mb-2">Account Created!</h1>
          <p>
            We've sent a verification link to <strong>{formData.email}</strong>.
          </p>
          <p>
            Please click the link in the email to activate your account before
            logging in.
          </p>
          <Link
            to="/login"
            className={"bg-primary text-primary p-2 rounded-lg mt-4 inline-block"}
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            Go to Login
          </Link>
        </div>
      </div>

    );
  }

  return (
    <div className="flex w-full justify-center items-center h-screen">
      <div
        className={"card m-4 !p-4 w-[400px] bg-black text-secondary font-bold"}
      >
        <Toaster position="top-center" />
        <h2 className="flex flex-col items-center text-2xl mb-4">
          Create Student Account
        </h2>
        <form onSubmit={handleSubmit} className={"flex flex-col gap-4"}>
          <div className={"imp"}>
            <label>Email</label>
            <input
              type="email"
              className="inp"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <p className={styles.error}>{errors.email}</p>}
          </div>
          <div className={""}>
            <label>Password</label>
            <input
              type="password"
              className="inp"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && (
              <p className={styles.error}>{errors.password}</p>
            )}
          </div>
          <div className={""}>
            <label>Confirm Password</label>
            <input
              type="password"
              className="inp"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && (
              <p className={styles.error}>{errors.confirmPassword}</p>
            )}
          </div>
          <button type="submit" className={"btn-main"} disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up & Verify"}
          </button>
        </form>
        <p className={"mt-4 text-center"}>
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
