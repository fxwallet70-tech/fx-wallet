import { useEffect, useState } from "react";

import AdminLayout from "../../layouts/AdminLayout";
import { getSettings, updateSettings } from "../../services/settingsService";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    supportPublicGroup: "https://t.me/FXwallet0",
    supportOfficialChannel: "https://t.me/+8tV1IrL6cdw3Zjc1",
    supportOfficialGmail: "fxwallet@gmail.com",
    supportCustomerSupport: "@FXwallet70",
  });

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      if (res.success && res.settings) {
        setForm({
          supportPublicGroup: res.settings.supportPublicGroup || "https://t.me/FXwallet0",
          supportOfficialChannel: res.settings.supportOfficialChannel || "https://t.me/+8tV1IrL6cdw3Zjc1",
          supportOfficialGmail: res.settings.supportOfficialGmail || "fxwallet@gmail.com",
          supportCustomerSupport: res.settings.supportCustomerSupport || "@FXwallet70",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      await updateSettings(form);
      setMessage("Support settings updated successfully");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading settings...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1>Settings</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600, marginTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h3>Customer Support Links</h3>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
            Update the support links shown to users in the app and website.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Public Group
          </label>
          <input
            name="supportPublicGroup"
            value={form.supportPublicGroup}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Official Channel
          </label>
          <input
            name="supportOfficialChannel"
            value={form.supportOfficialChannel}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Official Gmail
          </label>
          <input
            name="supportOfficialGmail"
            value={form.supportOfficialGmail}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Customer Support
          </label>
          <input
            name="supportCustomerSupport"
            value={form.supportCustomerSupport}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && (
          <p style={{ marginTop: 12, color: message.includes("success") ? "green" : "red" }}>
            {message}
          </p>
        )}
      </form>
    </AdminLayout>
  );
}
