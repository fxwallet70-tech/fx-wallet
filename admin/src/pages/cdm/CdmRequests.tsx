import { useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout';
import { getCdmRequests, updateCdmRequestStatus } from '../../services/cdmService';

const API_BASE = 'https://p01--nexora-backend--zlfp84xgf8wz.code.run';

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
      setRequests(response.proofs || []);
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
                      {req.plan?.duration ?? 0} days
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
                      <select
                        value={req.status}
                        disabled={req.status !== 'pending'}
                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approve & Activate</option>
                        <option value="rejected">Reject</option>
                      </select>
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