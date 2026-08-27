import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile, changePassword } from "../../services/profileService";
import type { ProfileData } from "../../services/profileService";

export default function Profile() {
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError("");
      const res = await getProfile();
      if (res.success && res.user) {
        setProfile(res.user);
        setFullName(res.user.fullName);
        setEmail(res.user.email);
        setMobile(res.user.mobile);
      }
    } catch (err: any) {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!fullName.trim()) {
      setSaveError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setSaveError("Email is required.");
      return;
    }
    if (!mobile.trim()) {
      setSaveError("Mobile number is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
      });

      if (res.success) {
        setSaveSuccess("Profile updated successfully!");
        setEditing(false);
        refreshUser();
      } else {
        setSaveError(res.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess("");
        }, 1500);
      } else {
        setPasswordError(res.message || "Failed to change password.");
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Unable to load profile</h2>
        <p className="empty-state-text">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>My Profile</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Manage your personal information
          </p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="card form-card">
        {/* Avatar Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          }}
        >
          <div
            className="avatar avatar-lg"
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              fontSize: 24,
              background: "#8B2635",
            }}
          >
            {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800 }}>
              {profile?.fullName || "User"}
            </h2>
            <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: 13 }}>
              {profile?.email}
            </p>
          </div>
        </div>

        {editing ? (
          <>
            {saveError && (
              <div
                style={{
                  color: "#fca5a5",
                  background: "#7f1d1d",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div
                style={{
                  color: "#86efac",
                  background: "#14532d",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {saveSuccess}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input
                className="form-input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFullName(profile?.fullName || "");
                  setEmail(profile?.email || "");
                  setMobile(profile?.mobile || "");
                  setSaveError("");
                  setSaveSuccess("");
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div
                  style={{
                    background: "#0F1210",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: 15,
                  }}
                >
                  {profile?.fullName || "-"}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div
                  style={{
                    background: "#0F1210",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: 15,
                  }}
                >
                  {profile?.email || "-"}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <div
                style={{
                  background: "#0F1210",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: 15,
                }}
              >
                {profile?.mobile || "-"}
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: "1px solid rgba(255, 255, 255, 0.18)",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !changingPassword && setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button
                className="modal-close"
                onClick={() => !changingPassword && setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {passwordError && (
                <div
                  style={{
                    color: "#fca5a5",
                    background: "#7f1d1d",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div
                  style={{
                    color: "#86efac",
                    background: "#14532d",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {passwordSuccess}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => !changingPassword && setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
