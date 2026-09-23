import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubscriptionHistory } from "../../services/subscriptionService";
import type { MySubscription } from "../../services/subscriptionService";
import { getRemainingBadge } from "../../utils/duration";

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setError("");
      const res = await getSubscriptionHistory();
      if (res.success) {
        setSubscriptions(res.subscriptions || []);
      }
    } catch (err: any) {
      setError("Unable to load subscription data.");
    } finally {
      setLoading(false);
    }
  };

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

  const getReturnStatus = (status?: string) => {
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Active":
        return "status-active";
      case "Expired":
        return "status-expired";
      case "Cancelled":
        return "status-cancelled";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading subscriptions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Unable to load data</h2>
        <p className="empty-state-text">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>My Subscriptions</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Track your active and past subscription plans
          </p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">No subscriptions yet</h2>
          <p className="empty-state-text">
            Subscribe to a plan to start earning returns.
          </p>
          <Link to="/plans" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse Plans
          </Link>
        </div>
      ) : (
        subscriptions.map((sub) => (
          <div key={sub._id} className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 800 }}>
                  {sub.plan?.title || "Plan"}
                </h3>
                <span
                  className={`status-badge ${getStatusBadge(sub.status)}`}
                  style={{ marginTop: 8, display: "inline-block" }}
                >
                  {sub.status}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Payment</div>
                <span
                  className={`status-badge ${sub.paymentStatus === "Paid" ? "status-active" : "status-pending"}`}
                >
                  {sub.paymentMethod} • {sub.paymentStatus}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 16,
                padding: "16px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.18)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Amount Paid</div>
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                  {formatCurrency(sub.amountPaid)}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Return Amount</div>
                <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                  {formatCurrency(sub.returnAmount)}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Start Date</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {formatDate(sub.startDate)}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>End Date</div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {formatDate(sub.endDate)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className={`status-badge ${getReturnStatus(sub.returnStatus).className}`}>
                {getReturnStatus(sub.returnStatus).label}
              </span>
              {sub.daysRemaining !== undefined && sub.status === "Active" && (
                <div
                  style={{
                    background: "#172554",
                    borderRadius: 12,
                    padding: "6px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#60a5fa", fontSize: 16, fontWeight: 800 }}>
                    {
                      getRemainingBadge(sub.endDate, {
                        days: "days remaining",
                        short: "remaining",
                      }).value
                    }
                  </span>
                  <span style={{ color: "#bfdbfe", fontSize: 11 }}>
                    {
                      getRemainingBadge(sub.endDate, {
                        days: "days remaining",
                        short: "remaining",
                      }).caption
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
