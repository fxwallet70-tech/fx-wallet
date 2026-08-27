import { useState, useEffect } from "react";
import { FiCopy, FiShare2, FiCheck, FiUsers, FiAward } from "react-icons/fi";
import { getMyReferralSummary, type ReferredUser } from "../../services/referralService";
import "../../styles/referral.css";

export default function ReferAndEarn() {
  const [referralCode, setReferralCode] = useState("");
  const [totalEarned, setTotalEarned] = useState(0);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const response = await getMyReferralSummary();
      if (response.success) {
        setReferralCode(response.referralCode);
        setTotalEarned(response.totalEarned);
        setReferredUsers(response.referredUsers || []);
      } else {
        setError("Failed to load referral data.");
      }
    } catch (err) {
      console.error("Referral summary error:", err);
      setError("Failed to load referral data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const shareText = `Join FX Wallet using my referral code ${referralCode} and start growing your wealth today!`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Refer & Earn - FX Wallet",
          text: shareText,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyCode();
        }
      }
    } else {
      handleCopyCode();
    }
  };

  if (isLoading) {
    return (
      <div className="referral-page">
        <div className="referral-loading">
          <div className="spinner"></div>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="referral-page">
        <div className="referral-error-card">
          <p>{error}</p>
          <button className="referral-retry-btn" onClick={loadReferralData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-page">
      <div className="referral-header">
        <h1 className="referral-title">Refer & Earn</h1>
        <p className="referral-subtitle">
          Invite friends and earn rewards when they join and invest
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="referral-card code-card">
        <div className="code-card-icon">
          <FiAward size={28} />
        </div>
        <span className="code-label">Your Referral Code</span>
        <span className="code-value">{referralCode}</span>

        <div className="code-actions">
          <button
            className={`code-action-btn ${copied ? "copied" : ""}`}
            onClick={handleCopyCode}
          >
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>

          <button className="code-action-btn share-btn" onClick={handleShare}>
            <FiShare2 size={16} />
            <span>{typeof navigator.share === "function" ? "Share" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="referral-card earnings-card">
        <div className="earnings-card-header">
          <FiAward size={20} />
          <span>Total Earnings from Referrals</span>
        </div>
        <span className="earnings-value">₹{totalEarned.toFixed(2)}</span>
        <p className="earnings-hint">
          You earn rewards when your referrals make their first investment
        </p>
      </div>

      {/* Referrals List */}
      <div className="referral-section">
        <div className="section-header">
          <FiUsers size={18} />
          <h2>Your Referrals</h2>
          <span className="section-count">{referredUsers.length}</span>
        </div>

        {referredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiUsers size={40} />
            </div>
            <h3>No referrals yet</h3>
            <p>
              You haven't referred anyone yet. Share your referral code to start earning!
            </p>
            <button className="share-now-btn" onClick={handleShare}>
              <FiShare2 size={16} />
              <span>Share Now</span>
            </button>
          </div>
        ) : (
          <div className="referrals-list">
            {referredUsers.map((r, index) => (
              <div key={index} className="referral-item">
                <div className="referral-item-left">
                  <div className="referral-avatar">
                    {r.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="referral-info">
                    <span className="referral-name">{r.fullName}</span>
                    <span className="referral-date">
                      Joined {new Date(r.joinedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="referral-item-right">
                  <span
                    className={`status-badge ${
                      r.status === "Rewarded" ? "rewarded" : "pending"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
