import { useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout';
import { getProofs, updateProofStatus } from '../../services/paymentProofService';

const API_BASE = 'https://site--fx-wallet--y5mbl8ygpzzy.code.run';

interface Proof {
  _id: string;
  user: {
    fullName: string;
    email: string;
    mobile: string;
  };
  screenshot: string;
  accountDetails: string;
  status: string;
  createdAt: string;
}

export default function PaymentProofs() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProofs = async () => {
    try {
      const response = await getProofs();
      setProofs(response.proofs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateProofStatus(id, status);
      fetchProofs();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className="plans-page">
        <div className="plans-header">
          <div>
            <h1>Payment Proofs</h1>
            <p>Review USDT payment screenshots submitted by users.</p>
          </div>
        </div>

        {loading ? (
          <div className="plans-message">Loading...</div>
        ) : proofs.length === 0 ? (
          <div className="plans-empty">
            <h3>No submissions yet</h3>
          </div>
        ) : (
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Screenshot</th>
                  <th>Account Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {proofs.map((proof) => (
                  <tr key={proof._id}>
                    <td>
                      <strong>{proof.user?.fullName}</strong>
                      <br />
                      {proof.user?.email}
                      <br />
                      {proof.user?.mobile}
                    </td>

                    <td>
                      <a
                        href={`${API_BASE}${proof.screenshot}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={`${API_BASE}${proof.screenshot}`}
                          alt="Proof"
                          style={{
                            width: 100,
                            borderRadius: 6,
                          }}
                        />
                      </a>
                    </td>

                    <td
                      style={{
                        maxWidth: 220,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {proof.accountDetails}
                    </td>

                    <td>
                      <span
                        className={
                          proof.status === 'approved'
                            ? 'status-badge active'
                            : proof.status === 'rejected'
                            ? 'status-badge inactive'
                            : ''
                        }
                      >
                        {proof.status}
                      </span>
                    </td>

                    <td>
                      <select
                        value={proof.status}
                        onChange={(e) =>
                          handleStatusChange(proof._id, e.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
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