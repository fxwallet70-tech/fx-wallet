import { useState, type ReactNode } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiGrid,
  FiPackage,
  FiCreditCard,
  FiBell,
  FiRefreshCcw,
  FiSettings,
  FiDollarSign,
  FiLogOut,
  FiUser,
  FiHelpCircle,
  FiPocket,
  FiShare2,
} from "react-icons/fi";
import "../styles/layout.css";
import "../styles/background.css";
import BackgroundEffects from "../components/BackgroundEffects";

const menus = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FiGrid />,
  },
  {
    name: "Plans",
    path: "/plans",
    icon: <FiPackage />,
  },
  {
    name: "My Subscription",
    path: "/subscription",
    icon: <FiRefreshCcw />,
  },
  {
    name: "Wallet",
    path: "/wallet",
    icon: <FiPocket />,
  },
  {
    name: "Refer & Earn",
    path: "/refer-and-earn",
    icon: <FiShare2 />,
  },
  {
    name: "USDT Deposit",
    path: "/usdt-deposit",
    icon: <FiDollarSign />,
  },
  {
    name: "Payments",
    path: "/payments",
    icon: <FiCreditCard />,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: <FiUser />,
  },
  {
    name: "Announcements",
    path: "/announcements",
    icon: <FiBell />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FiSettings />,
  },
];

export default function Layout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <BackgroundEffects />
      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">N</div>
          <div>
            <h2>FX WALLET</h2>
            <span>Dashboard</span>
          </div>
        </div>

        <p className="sidebar-section-title">MAIN MENU</p>

        <nav className="sidebar-menu">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={({ isActive }) =>
                isActive ? "menu active" : "menu"
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="menu-icon">
                {menu.icon}
              </span>
              <span className="menu-text">{menu.name}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className="sidebar-footer"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            window.open("https://t.me/FXwallet70", "_blank", "noopener,noreferrer");
          }}
          title="Contact support on Telegram"
        >
          <div className="sidebar-help-icon">
            <FiHelpCircle size={18} />
          </div>
          <div>
            <strong>Need Help?</strong>
            <span>Contact support on Telegram</span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="content">
        <header className="top-navbar">
          <div className="navbar-left">
            <button
              className="menu-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
            >
              <FiGrid size={22} />
            </button>
          </div>

          <div className="navbar-right">
            <div className="user-menu">
              <button
                className="user-avatar"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
              >
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </button>

              {userMenuOpen && (
                <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user?.fullName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="dropdown-info">
                      <span className="dropdown-name">{user?.fullName}</span>
                      <span className="dropdown-email">{user?.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <NavLink
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiUser size={16} />
                    <span>Profile</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiSettings size={16} />
                    <span>Settings</span>
                  </NavLink>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item logout"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <FiLogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
