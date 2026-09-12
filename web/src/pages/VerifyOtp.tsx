import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { verifyRegistrationOtp } from "../services/authService";
import "../styles/auth.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = (location.state as any)?.mobile || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const response = await verifyRegistrationOtp({ mobile, otp: otp.trim() });

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userData", JSON.stringify(response.user));

      // Kept so the session can be renewed once the access token expires.
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      navigate("/plans");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-title">Verify Mobile</div>
        <div className="auth-subtitle">Enter the code sent to {mobile}</div>

        {error && <div className="auth-error">{error}</div>}

        <input
          className="auth-input"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
    </div>
  );
}
