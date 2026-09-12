import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { forgotPassword, resetPassword } from "../services/authService";
import "../styles/auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword(email.trim());

      // The server never reveals whether an account exists, so it answers the
      // same way for an unknown address - and sends nothing. Claiming an OTP was
      // sent here is a lie the user only discovers when no email ever arrives.
      if (!response.mobile) {
        setMessage(
          response.message ||
            "If that email is registered, a reset code is on its way."
        );
        return;
      }

      setMobile(response.mobile);
      setStep("reset");

      // Deployments older than the email version answer with the code itself
      // instead of sending it. Surfacing it keeps the flow usable.
      if (response.resetCode) {
        console.warn(
          "Backend returned resetCode directly: /auth/forgot-password is not sending email on this server."
        );
        setMessage(
          `This server did not send an email. Your reset code is ${response.resetCode} (valid 10 minutes).`
        );
        return;
      }

      setMessage(
        response.message || "Check your inbox and spam folder for the 6-digit code."
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ mobile, otp: otp.trim(), newPassword });

      alert("Password reset successfully. Please log in.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-card"
        onSubmit={step === "email" ? handleSendOtp : handleReset}
      >
        <div className="auth-title">Forgot Password</div>
        <div className="auth-subtitle">
          {step === "email"
            ? "Enter your registered email. We will send a 6-digit code to that email (free, no SMS)."
            : "Check your email inbox / spam for the 6-digit code, then set a new password."}
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && !error && (
          <div className="auth-subtitle" style={{ color: "#4ade80" }}>
            {message}
          </div>
        )}

        {step === "email" ? (
          <input
            className="auth-input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <>
            <input
              className="auth-input"
              placeholder="Enter 6-digit code from email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />

            <input
              className="auth-input"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </>
        )}

        <button className="auth-button" type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : step === "email"
            ? "Send OTP"
            : "Reset Password"}
        </button>
      </form>
    </div>
  );
}