import { useEffect, useState } from "react";
import { getSettings } from "../../services/settingsService";
import type { AppSettings } from "../../services/settingsService";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setError("");
      const res = await getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err: any) {
      setError("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2 className="empty-state-title">Unable to load settings</h2>
        <p className="empty-state-text">{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={loadSettings}>
          Try Again
        </button>
      </div>
    );
  }

  const configs = [
    {
      title: "App Information",
      icon: "ℹ️",
      items: [
        { label: "App Name", value: settings?.appName || "FX Wallet" },
        { label: "Version", value: settings?.appVersion || "1.0.0" },
        { label: "Website", value: settings?.website, link: settings?.website },
      ],
    },
    {
      title: "Support",
      icon: "🛟",
      items: [
        { label: "Public Group", value: "https://t.me/FXwallet0", link: "https://t.me/FXwallet0" },
        { label: "Official Channel", value: "https://t.me/+8tV1IrL6cdw3Zjc1", link: "https://t.me/+8tV1IrL6cdw3Zjc1" },
        { label: "Official Gmail", value: "fxwallet@gmail.com", link: "mailto:fxwallet@gmail.com" },
        { label: "Customer Support", value: "@FXwallet70", link: "https://t.me/FXwallet70" },
      ],
    },
    {
      title: "Legal",
      icon: "📜",
      items: [
        { label: "Privacy Policy", value: "View Policy", link: settings?.privacyPolicy },
        { label: "Terms & Conditions", value: "View Terms", link: settings?.termsConditions },
      ],
    },
    {
      title: "About",
      icon: "📖",
      items: settings?.aboutUs
        ? [{ label: "About Us", value: settings.aboutUs }]
        : [{ label: "About Us", value: "FX Wallet is an investment platform." }],
    },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24 }}>Settings</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            App information and support
          </p>
        </div>
      </div>

      {configs.map((section) => (
        <div key={section.title} className="card" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
            }}
          >
            <span style={{ fontSize: 20 }}>{section.icon}</span>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
              {section.title}
            </h3>
          </div>

          {section.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "10px 0",
                borderBottom: idx < section.items.length - 1 ? "1px solid #181E1B" : "none",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 14 }}>{item.label}</span>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#8B2635",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "right",
                    maxWidth: "60%",
                    wordBreak: "break-word",
                  }}
                >
                  {item.value}
                </a>
              ) : (
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 14,
                    textAlign: "right",
                    maxWidth: "60%",
                    wordBreak: "break-word",
                    lineHeight: 1.5,
                    whiteSpace: item.value && item.value.length > 50 ? "pre-wrap" : undefined,
                  }}
                >
                  {item.value || "-"}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
