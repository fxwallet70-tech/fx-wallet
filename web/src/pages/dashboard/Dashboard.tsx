import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboard } from "../../services/dashboardService";
import type { DashboardData, Transaction } from "../../services/dashboardService";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");
      const result = await getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatCurrency = (amount?: number) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionTitle = (tx: Transaction) => {
    switch (tx.category) {
      case "MaturityReturn":
        return "Maturity Return";
      case "PlanPurchase":
        return "Plan Purchase";
      case "AdminCredit":
        return "Wallet Credit";
      case "AdminDebit":
        return "Wallet Debit";
      case "Refund":
        return "Refund";
      default:
        return tx.description || "Wallet Transaction";
    }
  };

  const getReturnStatusLabel = (status?: string) => {
    switch (status) {
      case "Pending":
        return { label: "Return Pending", className: "status-pending" };
      case "Processing":
        return { label: "Return Processing", className: "status-processing" };
      case "Credited":
        return { label: "Return Credited", className: "status-credited" };
      case "Failed":
        return { label: "Return Failed", className: "status-failed" };
      case "NotApplicable":
        return { label: "No Return", className: "status-expired" };
      default:
        return { label: status || "-", className: "" };
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading dashboard...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Dashboard unavailable</h2>
        <p className="empty-state-text">{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={loadDashboard}>
          Try Again
        </button>
      </div>
    );
  }

  const wallet = data?.wallet;
  const subscriptions = data?.subscriptions || [];
  const recentTransactions = data?.recentTransactions || [];
  const announcements = data?.announcements || [];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>
            Hello, {user?.fullName || "User"} 👋
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Welcome back to FX Wallet
          </p>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            borderLeft: "4px solid #fbbf24",
          }}
        >
          <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            📢 Latest Announcement
          </p>
          <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 16 }}>
            {announcements[0].title}
          </h3>
          <p style={{ color: "#cbd5e1", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {announcements[0].message}
          </p>
        </div>
      )}

      {/* Wallet Card */}
      <div
        className="wallet-card"
        onClick={() => navigate("/wallet")}
        style={{ cursor: "pointer" }}
      >
        <div className="wallet-header">
          <div>
            <div className="wallet-label">Available Balance</div>
            <div className="wallet-balance">{formatCurrency(wallet?.balance)}</div>
          </div>
          <span style={{ color: "#fff", fontSize: 34 }}>›</span>
        </div>
        <div className="wallet-stats">
          <div className="wallet-stat">
            <div className="wallet-stat-label">Pending Return</div>
            <div className="wallet-stat-value" style={{ color: "#fcd34d" }}>
              {formatCurrency(wallet?.pendingReturn)}
            </div>
          </div>
          <div className="wallet-stat">
            <div className="wallet-stat-label">Returns Received</div>
            <div className="wallet-stat-value" style={{ color: "#86efac" }}>
              {formatCurrency(wallet?.totalMaturityReturn)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: "4px solid #1d4ed8" }}>
          <div className="stat-content">
            <div className="stat-title">Total Balance</div>
            <div className="stat-value">{formatCurrency(wallet?.balance)}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="stat-content">
            <div className="stat-title">Pending Returns</div>
            <div className="stat-value" style={{ color: "#fcd34d" }}>
              {wallet?.pendingReturnCount || 0}
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #22c55e" }}>
          <div className="stat-content">
            <div className="stat-title">Returns Credited</div>
            <div className="stat-value" style={{ color: "#86efac" }}>
              {formatCurrency(wallet?.totalMaturityReturn)}
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #a855f7" }}>
          <div className="stat-content">
            <div className="stat-title">Active Plans</div>
            <div className="stat-value" style={{ color: "#60a5fa" }}>
              {subscriptions.filter((s) => s.status === "Active").length}
            </div>
          </div>
        </div>
      </div>

      {/* My Subscription Section */}
      <div className="section-header">
        <h2 className="section-title">My Subscription</h2>
        <Link to="/subscription" className="view-all">
          View Details
        </Link>
      </div>

      {subscriptions.length > 0 ? (
        subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="card"
            style={{ marginBottom: 12, cursor: "pointer" }}
            onClick={() => navigate("/subscription")}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 800 }}>
                  {sub.plan?.title || sub.plan?.name || "Plan"}
                </h3>
                <span className={`status-badge ${sub.status === "Active" ? "status-active" : "status-expired"}`}>
                  {sub.status}
                </span>
              </div>
              <div
                style={{                   background: "#172554",
                  borderRadius: 14,
                  padding: "9px 14px",
                  textAlign: "center",
                }}
              >                   <div style={{ color: "#60a5fa", fontSize: 19, fontWeight: 800 }}>
                  {sub.daysRemaining}
                </div>
                <div style={{ color: "#bfdbfe", fontSize: 10 }}>days left</div>
              </div>
            </div>
            <div
              style={{
                height: 1,
                background: "rgba(255, 255, 255, 0.18)",
                margin: "16px 0",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Amount Paid</div>
                <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, marginTop: 5 }}>
                  {formatCurrency(sub.amountPaid)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Expected Return</div>
                <div style={{ color: "#22c55e", fontSize: 17, fontWeight: 800, marginTop: 5 }}>
                  {formatCurrency(sub.returnAmount)}
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#111827",
                borderRadius: 11,
                padding: 11,
                marginTop: 15,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span className={`status-badge ${getReturnStatusLabel(sub.returnStatus).className}`}>
                {getReturnStatusLabel(sub.returnStatus).label}
              </span>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>
                {formatDate(sub.endDate)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <h3 style={{ color: "#fff", margin: "0 0 8px" }}>No Active Plan</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>
            Choose a plan to start your subscription.
          </p>
          <Link to="/plans" className="btn btn-primary">
            View Plans
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="section-title" style={{ marginTop: 24 }}>
        Quick Actions
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Plans", desc: "Browse plans", path: "/plans", emoji: "P" },
          { label: "Wallet", desc: "View balance", path: "/wallet", emoji: "W" },
          { label: "Subscription", desc: "Track maturity", path: "/subscription", emoji: "S" },
          { label: "Payments", desc: "View history", path: "/payments", emoji: "H" },
        ].map((action) => (
          <div
            key={action.path}
            className="card"
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
            onClick={() => navigate(action.path)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ color: "#1d4ed8", fontSize: 20, fontWeight: 900 }}>
              {action.emoji}
            </div>
            <h4 style={{ color: "#fff", margin: "10px 0 0", fontSize: 14, fontWeight: 800 }}>
              {action.label}
            </h4>
            <p style={{ color: "#94a3b8", fontSize: 11, margin: "4px 0 0" }}>
              {action.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="section-header">
        <h2 className="section-title">Recent Transactions</h2>
        <Link to="/wallet" className="view-all">
          View All
        </Link>
      </div>

      {recentTransactions.length > 0 ? (
        recentTransactions.map((tx) => {
          const isCredit = tx.type === "credit";
          return (
            <div
              key={tx._id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCredit ? "#14532d" : "#7f1d1d",
                  marginRight: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: isCredit ? "#22c55e" : "#ef4444",
                  }}
                >
                  {isCredit ? "+" : "−"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                  {getTransactionTitle(tx)}
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 10, marginTop: 4 }}>
                  {formatDate(tx.createdAt)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: isCredit ? "#22c55e" : "#ef4444",
                  whiteSpace: "nowrap",
                }}
              >
                {isCredit ? "+" : "−"}
                {formatCurrency(tx.amount)}
              </div>
            </div>
          );
        })
      ) : (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>
          No recent transactions found.
        </p>
      )}
    </div>
  );
}
