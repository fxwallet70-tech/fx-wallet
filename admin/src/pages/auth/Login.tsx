import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginRequest } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const data = await loginRequest(email, password);

      login(data.token, email);

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