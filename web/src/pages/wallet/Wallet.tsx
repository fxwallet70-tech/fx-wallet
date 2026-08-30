import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getWalletSummary, getTransactions } from "../../services/walletService";
import type { WalletSummary, WalletTransaction } from "../../services/walletService";

const emptySummary: WalletSummary = {
  balance: 0,
  totalCredit: 0,
  totalDebit: 0,
  todayCredit: 0,
  todayDebit: 0,
  pendingReturn: 0,
  pendingReturnCount: 0,
  totalMaturityReturn: 0,
};

export default function Wallet() {
  const [summary, setSummary] = useState<WalletSummary>(emptySummary);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWallet = useCallback(async () => {
    try {
      setError("");
      const [summaryRes, txRes] = await Promise.all([
        getWalletSummary(),
        getTransactions(),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.summary || emptySummary);
      }
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const formatCurrency = (amount: number) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionTitle = (tx: WalletTransaction) => {
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
        return tx.type === "credit" ? "Wallet Credit" : "Wallet Debit";
    }
  };

  const getTransactionSymbol = (tx: WalletTransaction) => {
    if (tx.category === "MaturityReturn") return "R";
    if (tx.category === "PlanPurchase") return "P";
    return tx.type === "credit" ? "+" : "−";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading wallet...
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Wallet unavailable</h2>
        <p className="empty-state-text">{error}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: 20 }}
          onClick={loadWallet}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>My Wallet</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            View your balance, pending returns and recent wallet activity.
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="wallet-card">
        <div className="wallet-label">Available Balance</div>
        <div className="wallet-balance">{formatCurrency(summary.balance)}</div>
        <div style={{ color: "#dbeafe", fontSize: 12, marginTop: 7 }}>
          Available for plan purchases
        </div>
      </div>

      {/* Pending Return Card */}
      <div
        className="card"
        style={{
          marginBottom: 14,
          border: "1px solid #1d4ed8",
          background: "#172554",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#bfdbfe", fontSize: 13 }}>Pending Return</div>
            <div
              style={{
                color: "#60a5fa",
                fontSize: 27,
                fontWeight: 800,
                marginTop: 5,
              }}
            >
              {formatCurrency(summary.pendingReturn)}
            </div>
          </div>
          <div
            style={{
              background: "#1e3a8a",
              borderRadius: 20,
              padding: "6px 11px",
            }}
          >
            <span style={{ color: "#bfdbfe", fontSize: 11, fontWeight: 700 }}>
              {summary.pendingReturnCount} active
            </span>
          </div>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
          This amount will be credited after eligible subscriptions mature.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="card">
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Total Credit</div>
          <div style={{ color: "#22c55e", fontSize: 17, fontWeight: 800, marginTop: 7 }}>
            {formatCurrency(summary.totalCredit)}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Total Debit</div>
          <div style={{ color: "#ef4444", fontSize: 17, fontWeight: 800, marginTop: 7 }}>
            {formatCurrency(summary.totalDebit)}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Today's Credit</div>
          <div style={{ color: "#22c55e", fontSize: 17, fontWeight: 800, marginTop: 7 }}>
            {formatCurrency(summary.todayCredit)}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Today's Debit</div>
          <div style={{ color: "#ef4444", fontSize: 17, fontWeight: 800, marginTop: 7 }}>
            {formatCurrency(summary.todayDebit)}
          </div>
        </div>
      </div>

      {/* Total Returns Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          border: "1px solid #166534",
          background: "#052e16",
        }}
      >
        <div style={{ color: "#86efac", fontSize: 13 }}>Total Returns Received</div>
        <div style={{ color: "#22c55e", fontSize: 23, fontWeight: 800, marginTop: 5 }}>
          {formatCurrency(summary.totalMaturityReturn)}
        </div>
      </div>

      {/* Payment History Link */}
      <Link
        to="/payments"
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
          View Payment History
        </span>
        <span style={{ color: "#1d4ed8", fontSize: 28, fontWeight: 500 }}>›</span>
      </Link>

      {/* Transactions */}
      <h2 className="section-title">Transactions</h2>

      {transactions.length > 0 ? (
        transactions.map((tx) => {
          const isCredit = tx.type === "credit";
          const isMaturityReturn = tx.category === "MaturityReturn";
          return (
            <div
              key={tx._id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "15px",
                marginBottom: 11,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  flexShrink: 0,
                  background: isMaturityReturn
                    ? "#B8860B"
                    : isCredit
                    ? "rgba(212,175,55,0.15)"
                    : "rgba(239,68,68,0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 800,
                    color: isCredit ? "#D4AF37" : "#ef4444",
                  }}
                >
                  {getTransactionSymbol(tx)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                  {getTransactionTitle(tx)}
                </div>
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  {tx.description || "Wallet transaction"}
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 11, marginTop: 5 }}>
                  {formatDate(tx.createdAt)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
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
        <div className="empty-state" style={{ padding: 40 }}>
          <h2 className="empty-state-title">No transactions found</h2>
          <p className="empty-state-text">Wallet activity will appear here.</p>
        </div>
      )}
    </div>
  );
}
