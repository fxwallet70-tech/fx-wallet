import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginRequest } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { consumeSessionExpired } from "../../api/session";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Surfaces "your session expired" when the admin was bounced here by a 401.
  const [notice] = useState(() =>
    consumeSessionExpired()
      ? "Your session has expired. Please log in again."
      : ""
  );

  async function handleLogin() {
    try {
      const data = await loginRequest(email, password);

      login(data.token, email, data.refreshToken);

      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        console.log("Backend Response:", error.response.data);

        alert(
          error.response.data.message || "Login Failed"
        );
      } else {
        alert(error.message || "Network Error");
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FX WALLET</h1>

        <p>Admin Panel</p>

        {notice && (
          <p style={{ color: "#DC2626", fontSize: "0.875rem" }}>{notice}</p>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}