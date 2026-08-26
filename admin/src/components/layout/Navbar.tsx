import {
  FiBell,
  FiLogOut,
  FiSearch,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h3>Admin Dashboard</h3>
        <p>Manage your FX Wallet platform</p>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search users..."
          />
        </div>

        <button
          type="button"
          className="notification-button"
          aria-label="Notifications"
        >
          <FiBell />

          <span className="notification-dot" />
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-details">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </header>
  );
}