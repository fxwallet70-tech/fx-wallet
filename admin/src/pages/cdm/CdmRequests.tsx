import { useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout';
import { getCdmRequests, updateCdmRequestStatus } from '../../services/cdmService';
import { formatPlanDuration } from '../../utils/duration';

const API_BASE = 'https://site--fx-wallet--y5mbl8ygpzzy.code.run';

interface CdmRequest {
  _id: string;
  user: {
    fullName: string;
    email: string;
    mobile: string;
  };
  plan: {
    title: string;
    price: number;
    duration: number;
    durationHours?: number;
    durationMinutes?: number;
  };
  payment: {
    amount: number;
    status: string;
    transactionId?: string;
  };
  subscription: {
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  screenshot: string;
  accountDetails: string;
  transactionId: string;
  status: string;
  createdAt: string;
}

const statusBadge = (status: string) => {
  if (status === 'approved') return 'status-badge active';
  if (status === 'rejected') return 'status-badge inactive';
  return '';
};

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function CdmRequests() {
  const [requests, setRequests] = useState<CdmRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await getCdmRequests();
      // Filter out rejected/deleted items — only show pending and approved
      const all = response.proofs || [];
      setRequests(all.filter((r: CdmRequest) => r.status !== 'rejected'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this CDM purchase?`)) return;

    try {
      const res = await updateCdmRequestStatus(id, status);
      alert(res.message || 'Status updated');
      fetchRequests();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
      fetchRequests();
    }
  };

  const handleDelete = async (id: string, status: string) => {
    if (!window.confirm('Remove this receipt from the list? The user subscription will not be affected.')) return;

    try {
      if (status === 'pending') {
        // Pending items: use API to reject (actually updates DB)
        await updateCdmRequestStatus(id, 'rejected');
      }
      // For approved items: just remove from local view
      // (remote API doesn't allow changing approved items)
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error: any) {
      // If API fails, still remove from local view
      setRequests((prev) => prev.filter((r) => r._id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="plans-page">
        <div className="plans-header">
          <div>
            <h1>CDM Plan Purchases</h1>
            <p>Review cash-deposit receipt screenshots for plan purchases. Approving activates the user's plan.</p>
          </div>
        </div>

        {loading ? (
          <div className="plans-message">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="plans-empty">
            <h3>No CDM submissions yet</h3>
          </div>
        ) : (
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Receipt</th>
                  <th>Deposit Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <strong>{req.user?.fullName}</strong>
                      <br />
                      {req.user?.email}
                      <br />
                      {req.user?.mobile}
                    </td>

                    <td>
                      <strong>{req.plan?.title}</strong>
                      <br />
                      ₹{Number(req.payment?.amount ?? req.plan?.price ?? 0).toFixed(2)}
                      <br />
                      {formatPlanDuration(req.plan || {})}
                    </td>

                    <td>
                      <a
                        href={`${API_BASE}${req.screenshot}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={`${API_BASE}${req.screenshot}`}
                          alt="Receipt"
                          style={{ width: 100, borderRadius: 6 }}
                        />
                      </a>
                    </td>

                    <td
                      style={{
                        maxWidth: 220,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {req.accountDetails}
                      {req.transactionId ? <><br /><strong>Txn:</strong> {req.transactionId}</> : null}
                    </td>

                    <td>
                      <span className={statusBadge(req.status)}>{req.status}</span>
                      {req.subscription ? (
                        <>
                          <br />
                          <span style={{ fontSize: 11, color: '#888' }}>
                            {req.subscription.status} · {formatDate(req.subscription.startDate)} → {formatDate(req.subscription.endDate)}
                          </span>
                        </>
                      ) : null}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {req.status === 'pending' ? (
                          <select
                            value={req.status}
                            onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve & Activate</option>
                            <option value="rejected">Reject</option>
                          </select>
                        ) : null}
                        <button
                          onClick={() => handleDelete(req._id, req.status)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}