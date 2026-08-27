import { useState, useRef, useEffect, useCallback } from "react";
import {
  submitPaymentProof,
  getMyProofs,
  deletePaymentProof,
} from "../../services/paymentProofService";
import type { PaymentProof } from "../../services/paymentProofService";

export default function PaymentProof() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [accountDetails, setAccountDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProofs = useCallback(async () => {
    try {
      const res = await getMyProofs();
      if (res.success) {
        setProofs(res.proofs || []);
      }
    } catch {
      // silently fail — history is non-critical
    } finally {
      setProofsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProofs();
  }, [loadProofs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      setScreenshot(null);
      setPreview("");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      setScreenshot(null);
      setPreview("");
      return;
    }

    setError("");
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!screenshot) {
      setError("Please select a screenshot of your payment.");
      return;
    }

    if (!accountDetails.trim()) {
      setError("Please enter the account details you sent the payment to.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitPaymentProof({
        screenshot,
        accountDetails: accountDetails.trim(),
      });

      if (res.success) {
        setSuccess(res.message || "Payment proof submitted successfully!");
        setScreenshot(null);
        setPreview("");
        setAccountDetails("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh history
        loadProofs();
      } else {
        setError(res.message || "Failed to submit payment proof.");
      }
    } catch (err: any) {
      setError(
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

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>
            Submit Payment Proof
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Upload a screenshot and enter account details for admin verification
          </p>
        </div>
      </div>

      <div className="card form-card">
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
              How it works
            </strong>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Make your payment via bank transfer or USDT, then upload the transaction
              screenshot and enter the account details you paid to. Our team will verify
              and credit your wallet within 24 hours.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
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
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
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
            {success}
          </div>
        )}

        {/* Screenshot Upload */}
        <div className="form-group">
          <label className="form-label">Payment Screenshot</label>

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
                  alt="Payment preview"
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
                  Click to upload screenshot
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
          <label className="form-label">Account Details</label>
          <textarea
            className="form-input"
            placeholder="Enter the account details, UPI ID, wallet address, or bank details you sent the payment to..."
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            rows={4}
            style={{ resize: "vertical", minHeight: 100, fontFamily: "inherit" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 12 }}>
              Provide as much detail as possible for faster verification
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
            "Submit for Review"
          )}
        </button>
      </div>

      {/* Submission History */}
      <div style={{ marginTop: 40 }}>
        <div className="section-header">
          <h2 className="section-title">Submission History</h2>
        </div>

        {proofsLoading ? (
          <div className="loading">
            <div className="spinner" />
            Loading history...
          </div>
        ) : proofs.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No submissions yet</h3>
            <p className="empty-state-text">
              Your submitted payment proofs will appear here.
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
                      Proof #{proof._id.slice(-6).toUpperCase()}
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
                      Account Details
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
                      }}
                    >
                      {proof.accountDetails}
                    </div>
                  </div>

                  {proof.screenshot && (
                    <div>
                      <div className="form-label" style={{ marginBottom: 6 }}>
                        Screenshot
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
                      ? "✅ This payment proof has been approved and your wallet has been credited."
                      : proof.status === "rejected"
                      ? "❌ This payment proof has been rejected. Please submit a new proof with correct details."
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
