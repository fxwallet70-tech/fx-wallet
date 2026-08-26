import {
  FiGrid,
  FiUsers,
  FiPackage,
  FiCreditCard,
  FiBell,
  FiRefreshCcw,
  FiSettings,
  FiDollarSign,
  FiImage,
  FiGift,
  FiShield,
  FiBookOpen,
} from "react-icons/fi";

import { NavLink } from "react-router-dom";

const menus = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FiGrid />,
  },
  {
    name: "Users",
    path: "/users",
    icon: <FiUsers />,
  },
  {
    name: "Plans",
    path: "/plans",
    icon: <FiPackage />,
  },
  {
    name: "Wallet",
    path: "/wallet",
    icon: <FiCreditCard />,
  },
  {
    name: "Announcements",
    path: "/announcements",
    icon: <FiBell />,
  },
  {
    name: "Returns",
    path: "/returns",
    icon: <FiRefreshCcw />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FiSettings />,
  },
  {
    name: "USDT Payment",
    path: "/usdt-payment",
    icon: <FiDollarSign />,
  },
  {
    name: "Payment Proofs",
    path: "/payment-proofs",
    icon: <FiImage />,
  },
  {
    name: "CDM Plan Purchases",
    path: "/cdm-requests",
    icon: <FiShield />,
  },
  {
    name: "CDM Payment Info",
    path: "/cdm-payment",
    icon: <FiBookOpen />,
  },
  {
    name: "Refer & Earn",
    path: "/referral",
    icon: <FiGift />,
  },



];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">N</div>

        <div>
          <h2>FX WALLET</h2>
          <span>Admin Panel</span>
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
          >
            <span className="menu-icon">{menu.icon}</span>

            <span className="menu-text">{menu.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-help-icon">?</div>

        <div>
          <strong>Need Help?</strong>
          <span>Contact support</span>
        </div>
      </div>
    </aside>
  );
}