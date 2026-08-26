import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import { createAnnouncement } from "../../services/announcementService";

export default function AddAnnouncement() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    message: "",
    status: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async () => {
    const cleanTitle = form.title.trim();
    const cleanMessage = form.message.trim();

    if (!cleanTitle) {
      setError("Please enter an announcement title.");
      return;
    }

    if (!cleanMessage) {
      setError("Please enter an announcement message.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createAnnouncement({
        title: cleanTitle,
        message: cleanMessage,
        status: form.status,
      });

      alert("Announcement created successfully");

      navigate("/announcements");
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to create announcement."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="announcement-page">
        <div className="announcement-header">
          <div>
            <span className="page-eyebrow">
              Communication
            </span>

            <h1>Create Announcement</h1>

            <p>
              Publish important updates and notices for FX Wallet users.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/announcements")}
          >
            Back to Announcements
          </button>
        </div>

        <div className="announcement-layout">
          <div className="announcement-form-card">
            <div className="form-card-header">
              <div className="form-icon">📢</div>

              <div>
                <h2>Announcement Details</h2>
                <p>
                  Enter the title and message you want users to see.
                </p>
              </div>
            </div>

            {error ? (
              <div className="announcement-error">
                {error}
              </div>
            ) : null}

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="title">
                  Announcement title
                </label>

                <span>
                  {form.title.length}/100
                </span>
              </div>

              <input
                id="title"
                name="title"
                type="text"
                maxLength={100}
                placeholder="For example: Scheduled maintenance"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="message">
                  Message
                </label>

                <span>
                  {form.message.length}/500
                </span>
              </div>

              <textarea
                id="message"
                name="message"
                placeholder="Write your announcement message..."
                rows={8}
                maxLength={500}
                value={form.message}
                onChange={handleChange}
              />

              <small className="field-help">
                Keep the message simple and easy to understand.
              </small>
            </div>

            <div className="status-setting">
              <div>
                <strong>Publish immediately</strong>

                <p>
                  Active announcements will be visible to users.
                </p>
              </div>

              <button
                type="button"
                aria-label="Toggle announcement status"
                className={`toggle-switch ${
                  form.status ? "toggle-active" : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    status: !prev.status,
                  }))
                }
              >
                <span />
              </button>
            </div>

            <div className="announcement-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                onClick={() => navigate("/announcements")}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? "Publishing..."
                  : "Publish Announcement"}
              </button>
            </div>
          </div>

          <div className="announcement-preview-card">
            <div className="preview-heading">
              <span>Live Preview</span>

              <span
                className={`preview-status ${
                  form.status
                    ? "preview-active"
                    : "preview-inactive"
                }`}
              >
                {form.status ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="preview-content">
              <div className="preview-icon">
                📢
              </div>

              <div>
                <h3>
                  {form.title.trim() ||
                    "Announcement title"}
                </h3>

                <p>
                  {form.message.trim() ||
                    "Your announcement message will appear here."}
                </p>
              </div>
            </div>

            <div className="preview-footer">
              FX Wallet Admin • Just now
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}