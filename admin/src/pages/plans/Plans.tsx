import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getPlans,
  deletePlan,
} from "../../services/planService";
import { formatPlanDuration } from "../../utils/duration";

interface Plan {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration: number;
  durationHours?: number;
  durationMinutes?: number;
  returnAmount?: number;
  status: boolean;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);

    try {
      const response = await getPlans();
      setPlans(response.plans || []);
    } catch (error) {
      console.error(error);
      alert("Unable to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const removePlan = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this plan?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await deletePlan(id);

      setPlans((currentPlans) =>
        currentPlans.filter(
          (plan) => plan._id !== id,
        ),
      );

      alert("Plan deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Unable to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="plans-page">
        <div className="plans-header">
          <div>
            <h1>Plan Management</h1>
            <p>
              Create and manage subscription plans.
            </p>
          </div>

          <Link
            className="add-plan-button"
            to="/plans/add"
          >
            + Add New Plan
          </Link>
        </div>

        {loading ? (
          <div className="plans-message">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="plans-empty">
            <h3>No plans found</h3>
            <p>
              Create your first plan to display it
              in the mobile application.
            </p>

            <Link
              className="add-plan-button"
              to="/plans/add"
            >
              Create Plan
            </Link>
          </div>
        ) : (
          <div className="plan-table-wrapper">
            <table className="plan-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Return Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id}>
                    <td>
                      <strong>{plan.title}</strong>
                    </td>

                    <td>{plan.category}</td>

                    <td>
                      ₹
                      {Number(
                        plan.price || 0,
                      ).toFixed(2)}
                    </td>

                    <td>
                      {formatPlanDuration(plan)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        plan.returnAmount || 0,
                      ).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={
                          plan.status
                            ? "status-badge active"
                            : "status-badge inactive"
                        }
                      >
                        {plan.status
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="plan-actions">
                        <Link
                          className="edit-plan-button"
                          to={`/plans/edit/${plan._id}`}
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className="delete-plan-button"
                          disabled={
                            deletingId === plan._id
                          }
                          onClick={() =>
                            removePlan(plan._id)
                          }
                        >
                          {deletingId === plan._id
                            ? "Deleting..."
                            : "Delete"}
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