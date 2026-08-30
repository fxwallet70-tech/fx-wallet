import { useEffect, useState } from "react";
import { getAnnouncements } from "../../services/announcementService";
import type { Announcement } from "../../services/announcementService";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setError("");
      const res = await getAnnouncements();
      if (res.success) {
        const list = res.announcements || [];
        // Show active announcements first, then all sorted by date
        list.sort((a, b) => {
          if (a.status && !b.status) return -1;
          if (!a.status && b.status) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        setAnnouncements(list);
      }
    } catch (err: any) {
      setError("Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading announcements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Unable to load announcements</h2>
        <p className="empty-state-text">{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={loadAnnouncements}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>Announcements</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            Latest news and updates from FX Wallet
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📢</div>
          <h2 className="empty-state-title">No announcements</h2>
          <p className="empty-state-text">
            There are no announcements at this time. Check back later.
          </p>
        </div>
      ) : (
        announcements.map((announcement) => (
          <div
            key={announcement._id}
            className="card"
            style={{
              marginBottom: 16,
              borderLeft: announcement.status ? "4px solid #1d4ed8" : "4px solid rgba(255, 255, 255, 0.18)",
              opacity: announcement.status ? 1 : 0.6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {announcement.title}
              </h3>
              {announcement.createdAt && (
                <span style={{ color: "rgba(255, 255, 255, 0.18)", fontSize: 12, whiteSpace: "nowrap", marginLeft: 12 }}>
                  {formatDate(announcement.createdAt)}
                </span>
              )}
            </div>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {announcement.message}
            </p>
            {!announcement.status && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "rgba(255, 255, 255, 0.18)",
                }}
              >
                Archived
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
