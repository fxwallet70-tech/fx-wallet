import { useEffect, useState, useRef, useCallback } from "react";
import { getUsdtPayment } from "../../services/usdtPaymentService";
import type { UsdtPaymentData } from "../../services/usdtPaymentService";
import {
  submitPaymentProof,
  getMyProofs,
  deletePaymentProof,
} from "../../services/paymentProofService";
import type { PaymentProof } from "../../services/paymentProofService";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function UsdtDeposit() {
  // USDT details
  const [data, setData] = useState<UsdtPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Payment Proof
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [accountDetails, setAccountDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccess, setProofSuccess] = useState("");

  // History
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsdtPayment();
    loadProofs();
  }, []);

  const loadUsdtPayment = async () => {
    try {
      setError("");
      const res = await getUsdtPayment();
      if (res.success && res.usdtPayment) {
        setData(res.usdtPayment);
      } else {
        setError("USDT payment details not available.");
      }
    } catch (err: any) {
      setError("Unable to load USDT payment details.");
    } finally {
      setLoading(false);
    }
  };

  const loadProofs = useCallback(async () => {
    try {
      const res = await getMyProofs();
      if (res.success) {
        setProofs(res.proofs || []);
      }
    } catch {
      // silently fail
    } finally {
      setProofsLoading(false);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Proof upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setProofError("Please select a valid image file (JPEG, PNG, or WebP).");
      setScreenshot(null);
      setPreview("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProofError("File size must be less than 5MB.");
      setScreenshot(null);
      setPreview("");
      return;
    }

    setProofError("");
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setProofError("");
    setProofSuccess("");

    if (!screenshot) {
      setProofError("Please select a screenshot of your USDT payment.");
      return;
    }

    if (!accountDetails.trim()) {
      setProofError("Please enter your USDT wallet address or account details.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitPaymentProof({
        screenshot,
        accountDetails: accountDetails.trim(),
      });

      if (res.success) {
        setProofSuccess(res.message || "Payment proof submitted successfully!");
        setScreenshot(null);
        setPreview("");
        setAccountDetails("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        loadProofs();
      } else {
        setProofError(res.message || "Failed to submit payment proof.");
      }
    } catch (err: any) {
      setProofError(
        err.response?.data?.message ||
        "Failed to submit payment proof. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!window.confirm("Are you sure you want to delete this pending proof?")) return;

    try {
      setDeletingId(proofId);
      const res = await deletePaymentProof(proofId);
      if (res.success) {
        setProofs((prev) => prev.filter((p) => p._id !== proofId));
        if (selectedProof?._id === proofId) setSelectedProof(null);
      } else {
        alert(res.message || "Failed to delete proof.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete proof.");
    } finally {
      setDeletingId(null);
    }
  };

  // Render
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading USDT details...
      </div>
    );
  }

  const walletAddress = data?.description?.match(/0x[a-fA-F0-9]{40,}/)?.[0];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>USDT Deposit</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Send USDT and upload your payment proof for verification
          </p>
        </div>
      </div>

      {/* === STEP 1: USDT Payment Details === */}
      <div className="card form-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#8B2635",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            1
          </div>
          <div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
              Send USDT Payment
            </h3>
            <p style={{ color: "#94a3b8", margin: "2px 0 0", fontSize: 13 }}>
              Transfer USDT to the address below
            </p>
          </div>
        </div>

        {error ? (
          <div
            style={{
              background: "#7f1d1d",
              borderRadius: 10,
              padding: "16px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>💵</div>
            <h3 style={{ color: "#fca5a5", margin: "0 0 4px", fontSize: 16 }}>
              No USDT Deposit Info
            </h3>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: 0, opacity: 0.8 }}>
              {error}
            </p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            {data?.image && (
              <div
                style={{
                  marginBottom: 16,
                  textAlign: "center",
                  background: "#0F1210",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <img
                  src={
                    data.image.startsWith("http")
                      ? data.image
                      : `${API_URL.replace(/\/api\/?$/, "")}${data.image.startsWith("/") ? data.image : "/" + data.image}`
                  }
                  alt="USDT QR Code"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 280,
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Wallet Address */}
            {walletAddress && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">USDT Wallet Address (ERC20 / BEP20)</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#0F1210",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      flex: 1,
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {walletAddress}
                  </span>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {data?.description && (
              <div
                style={{
                  background: "#0F1210",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <div className="form-label">Deposit Instructions</div>
                <p
                  style={{
                    color: "#cbd5e1",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: "8px 0 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {data.description}
                </p>
              </div>
            )}

            {/* Warning */}
            <div
              style={{
                background: "#7f1d1d",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <p style={{ color: "#fca5a5", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                ⚠️ Only send USDT to the address above. Double-check the network (ERC20/BEP20/TRC20) before sending. Transactions cannot be reversed.
              </p>
            </div>
          </>
        )}
      </div>

      {/* === STEP 2: Upload Payment Proof === */}
      <div className="card form-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            2
          </div>
          <div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
              Upload Payment Proof
            </h3>
            <p style={{ color: "#94a3b8", margin: "2px 0 0", fontSize: 13 }}>
              Submit your USDT transaction screenshot for verification
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: "#172554",
            border: "1px solid #1d4ed8",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
          <div>
            <strong style={{ color: "#93c5fd", fontSize: 13, display: "block", marginBottom: 4 }}>
              After sending USDT
            </strong>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Upload the transaction screenshot from your wallet (MetaMask, Trust Wallet, etc.)
              and enter your wallet address. Our team will verify and credit your FX Wallet wallet.
            </p>
          </div>
        </div>

        {/* Error */}
        {proofError && (
          <div
            style={{
              color: "#fca5a5",
              background: "#7f1d1d",
              border: "1px solid #b91c1c",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            {proofError}
          </div>
        )}

        {/* Success */}
        {proofSuccess && (
          <div
            style={{
              color: "#86efac",
              background: "#14532d",
              border: "1px solid #166534",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              marginBottom: 20,
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✅</span>
            {proofSuccess}
          </div>
        )}

        {/* Screenshot Upload */}
        <div className="form-group">
          <label className="form-label">Transaction Screenshot</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(255, 255, 255, 0.18)",
              borderRadius: 12,
              padding: preview ? 12 : 32,
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
              background: preview ? "#0F1210" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!preview) e.currentTarget.style.borderColor = "#8B2635";
            }}
            onMouseLeave={(e) => {
              if (!preview) e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
            }}
          >
            {preview ? (
              <div style={{ position: "relative" }}>
                <img
                  src={preview}
                  alt="Transaction preview"
                  style={{
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setScreenshot(null);
                    setPreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: "#181E1B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <span style={{ fontSize: 24 }}>📷</span>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                  Click to upload USDT transaction screenshot
                </p>
                <p style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 12, margin: 0 }}>
                  JPEG, PNG, or WebP · Max 5MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        {/* Account Details */}
        <div className="form-group">
          <label className="form-label">Your Wallet Address</label>
          <textarea
            className="form-input"
            placeholder="Enter your USDT wallet address (the one you sent from)..."
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            rows={3}
            style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 12 }}>
              We'll credit your FX Wallet wallet after verification
            </span>
            <span
              style={{
                color: accountDetails.length > 500 ? "#fca5a5" : "rgba(255, 255, 255, 0.18)",
                fontSize: 12,
              }}
            >
              {accountDetails.length}/500
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 8 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Submitting...
            </span>
          ) : (
            "Submit for Verification"
          )}
        </button>
      </div>

      {/* === STEP 3: Submission History === */}
      <div className="card form-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            3
          </div>
          <div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
              Submission History
            </h3>
            <p style={{ color: "#94a3b8", margin: "2px 0 0", fontSize: 13 }}>
              Track your payment verification status
            </p>
          </div>
        </div>

        {proofsLoading ? (
          <div className="loading">
            <div className="spinner" />
            Loading history...
          </div>
        ) : proofs.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No submissions yet</h3>
            <p className="empty-state-text">
              Your submitted USDT payment proofs will appear here after you submit one.
            </p>
          </div>
        ) : (
          proofs.map((proof) => (
            <div
              key={proof._id}
              className="card"
              style={{
                marginBottom: 12,
                cursor: "pointer",
                transition: "border-color 0.2s",
                borderColor: selectedProof?._id === proof._id ? "#8B2635" : undefined,
                padding: 16,
              }}
              onClick={() =>
                setSelectedProof(selectedProof?._id === proof._id ? null : proof)
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#0F1210",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {proof.screenshot ? (
                      <img
                        src={proof.screenshot}
                        alt="Proof"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.innerHTML = "📷";
                        }}
                      />
                    ) : (
                      <span>📷</span>
                    )}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                      USDT Deposit #{proof._id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 11, marginTop: 2 }}>
                      {new Date(proof.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <span
                  className={`status-badge ${
                    proof.status === "approved"
                      ? "status-credited"
                      : proof.status === "rejected"
                      ? "status-failed"
                      : "status-pending"
                  }`}
                >
                  {proof.status === "approved"
                    ? "✅ Approved"
                    : proof.status === "rejected"
                    ? "❌ Rejected"
                    : "⏳ Pending"}
                </span>
              </div>

              {/* Expandable Details */}
              {selectedProof?._id === proof._id && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255, 255, 255, 0.18)",
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div className="form-label" style={{ marginBottom: 6 }}>
                      Wallet Address Sent From
                    </div>
                    <div
                      style={{
                        background: "#0F1210",
                        borderRadius: 8,
                        padding: "10px 14px",
                        color: "#cbd5e1",
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "monospace",
                      }}
                    >
                      {proof.accountDetails}
                    </div>
                  </div>

                  {proof.screenshot && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="form-label" style={{ marginBottom: 6 }}>
                        Transaction Screenshot
                      </div>
                      <a
                        href={
                          proof.screenshot.startsWith("http")
                            ? proof.screenshot
                            : `${""}${proof.screenshot}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={
                            proof.screenshot.startsWith("http")
                              ? proof.screenshot
                              : `${""}${proof.screenshot}`
                          }
                          alt="Payment Screenshot"
                          style={{
                            width: "100%",
                            maxHeight: 300,
                            objectFit: "contain",
                            borderRadius: 8,
                            background: "#0F1210",
                            padding: 8,
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).insertAdjacentHTML(
                              "afterend",
                              '<p style="color:rgba(255, 255, 255, 0.18);font-size:13px;padding:12px">Image not available</p>'
                            );
                          }}
                        />
                      </a>
                    </div>
                  )}

                  {/* Delete button for pending proofs */}
                  {proof.status === "pending" && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(255, 255, 255, 0.18)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(proof._id);
                        }}
                        disabled={deletingId === proof._id}
                      >
                        {deletingId === proof._id ? "Deleting..." : "Delete Proof"}
                      </button>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      background:
                        proof.status === "approved"
                          ? "#14532d"
                          : proof.status === "rejected"
                          ? "#7f1d1d"
                          : "#78350f",
                      color:
                        proof.status === "approved"
                          ? "#86efac"
                          : proof.status === "rejected"
                          ? "#fca5a5"
                          : "#fcd34d",
                    }}
                  >
                    {proof.status === "approved"
                      ? "✅ This deposit has been verified and your wallet has been credited."
                      : proof.status === "rejected"
                      ? "❌ This deposit was rejected. Please submit a new proof with correct details."
                      : "⏳ Your submission is pending review. Our team will verify it shortly."}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
