import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";
import {
  getPlan,
  updatePlan,
} from "../../services/planService";
import {
  formatPlanDuration,
  validatePlanDurationInput,
} from "../../utils/duration";

export default function EditPlan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    image: "",
    price: 0,
    duration: 30,
    durationHours: 0,
    durationMinutes: 0,
    returnAmount: 0,
    displayOrder: 1,
    status: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [id]);

  async function loadPlan() {
    if (!id) {
      alert("Plan ID is missing");
      navigate("/plans");
      return;
    }

    try {
      setLoading(true);

      const res = await getPlan(id);
      const plan = res.plan;

      setForm({
        title: plan.title || "",
        description: plan.description || "",
        category: plan.category || "General",
        image: plan.image || "",
        price: Number(plan.price || 0),
        duration: Number(plan.duration || 0),
        durationHours: Number(plan.durationHours || 0),
        durationMinutes: Number(plan.durationMinutes || 0),
        returnAmount: Number(
          plan.returnAmount || 0
        ),
        displayOrder: Number(
          plan.displayOrder || 1
        ),
        status:
          plan.status === undefined
            ? true
            : Boolean(plan.status),
      });
    } catch (error: any) {
      console.error("Load Plan Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load plan"
      );

      navigate("/plans");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" ||
        name === "duration" ||
        name === "durationHours" ||
        name === "durationMinutes" ||
        name === "returnAmount" ||
        name === "displayOrder"
          ? Number(value)
          : name === "status"
          ? value === "true"
          : value,
    }));
  }

  async function savePlan() {
    if (!id) return;

    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }

    const durationError = validatePlanDurationInput(form);

    if (durationError) {
      alert(durationError);
      return;
    }

    if (form.price < 0 || form.returnAmount < 0) {
      alert("Amount cannot be negative");
      return;
    }

    try {
      setSaving(true);

      await updatePlan(id, {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        image: form.image.trim(),
        price: Number(form.price),
        duration: Number(form.duration),
        durationHours: Number(form.durationHours),
        durationMinutes: Number(form.durationMinutes),
        returnAmount: Number(form.returnAmount),
        displayOrder: Number(form.displayOrder),
      });

      alert("Plan Updated Successfully");
      navigate("/plans");
    } catch (error: any) {
      console.error("Update Plan Error:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to update plan"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading plan...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="plan-form-page">
        <div className="plan-form-header">
          <div>
            <h1>Edit Plan</h1>
            <p>Update plan information.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/plans")}
          >
            Back
          </button>
        </div>

        <div className="plan-form-card">
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Duration</label>

              <div className="duration-fields">
                <div className="form-group">
                  <label>Days</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Hours (0-23)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    step="1"
                    name="durationHours"
                    value={form.durationHours}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Minutes (0-59)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    name="durationMinutes"
                    value={form.durationMinutes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <span className="duration-hint">
                Plan runs for {formatPlanDuration(form)}. Use hours and minutes
                for plans shorter than a day, e.g. 0 days, 2 hours, 30 minutes.
              </span>
            </div>

            <div className="form-group">
              <label>Return Amount</label>
              <input
                type="number"
                min="0"
                name="returnAmount"
                value={form.returnAmount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Display Order</label>
              <input
                type="number"
                min="0"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={String(form.status)}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/plans")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={savePlan}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Plan"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}