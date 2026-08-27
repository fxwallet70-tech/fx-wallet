//this is a new  file created 

import { useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout';
import { getUsdtPayment, updateUsdtPayment } from '../../services/usdtPaymentService';

const API_BASE = 'https://site--fx-wallet--y5mbl8ygpzzy.code.run';

export default function UsdtPayment() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const response = await getUsdtPayment();
      setCurrentImage(response.data.image);
      setDescription(response.data.description || '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUsdtPayment(selectedFile, description);
      alert('USDT payment info updated successfully');
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to update USDT payment info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="plans-message">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="plans-page">
        <div className="plans-header">
          <div>
            <h1>USDT Payment</h1>
            <p>Upload a QR code / screenshot and description shown to users in the app.</p>
          </div>
        </div>

        <div className="plan-table-wrapper" style={{ padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Current Image</label>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: 250, borderRadius: 8, marginBottom: 12 }}
              />
            ) : currentImage ? (
              <img
                src={`${API_BASE}${currentImage}`}
                alt="USDT QR"
                style={{ maxWidth: 250, borderRadius: 8, marginBottom: 12 }}
              />
            ) : (
              <p style={{ color: '#888' }}>No image uploaded yet</p>
            )}

            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: 10, borderRadius: 8 }}
              placeholder="Write instructions for users about this USDT payment method..."
            />
          </div>

          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}